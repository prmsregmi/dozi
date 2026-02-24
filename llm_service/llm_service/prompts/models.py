"""Pydantic models for prompt configuration and validation."""

import re
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class ModelParams(BaseModel):
    """LLM model parameters."""

    temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    response_format: str = "json_object"
    max_tokens: int | None = Field(default=None, ge=1)


class PromptMetadata(BaseModel):
    """Metadata about the prompt."""

    name: str
    version: str
    description: str
    model_params: ModelParams = Field(default_factory=ModelParams)

    @field_validator("version")
    @classmethod
    def validate_version(cls, v: str) -> str:
        """Validate semantic version format."""
        if not re.match(r"^\d+\.\d+\.\d+$", v):
            raise ValueError(f"Version must be in semver format (e.g., 1.0.0), got: {v}")
        return v


class PromptVariable(BaseModel):
    """Definition of a template variable."""

    name: str
    description: str
    required: bool = True


class PromptTemplate(BaseModel):
    """Prompt template with system and user messages."""

    system_message: str
    user_message: str

    @model_validator(mode="after")
    def validate_transcript_placeholder(self) -> "PromptTemplate":
        """Ensure {transcript} placeholder exists in user_message."""
        if "{transcript}" not in self.user_message:
            raise ValueError("user_message must contain {transcript} placeholder")
        return self


class OutputFormat(BaseModel):
    """Expected output format definition."""

    type: str = "json"
    schema_: dict[str, Any] = Field(default_factory=dict, alias="schema")


class Prompt(BaseModel):
    """Complete prompt configuration."""

    metadata: PromptMetadata
    template: PromptTemplate
    variables: list[PromptVariable] = Field(default_factory=list)
    output_format: OutputFormat = Field(default_factory=OutputFormat)

    @model_validator(mode="after")
    def ensure_transcript_variable(self) -> "Prompt":
        """Ensure transcript variable is defined."""
        has_transcript = any(v.name == "transcript" for v in self.variables)
        if not has_transcript:
            self.variables.append(
                PromptVariable(
                    name="transcript",
                    description="The conversation transcript to analyze",
                    required=True,
                )
            )
        return self

    def format(self, **kwargs: Any) -> str:
        """
        Format the user message with provided variables.

        Args:
            **kwargs: Variables to substitute in the template

        Returns:
            Formatted user message

        Raises:
            ValueError: If required variables are missing
        """
        # Check for required variables
        required_vars = {v.name for v in self.variables if v.required}
        provided_vars = set(kwargs.keys())
        missing_vars = required_vars - provided_vars

        if missing_vars:
            raise ValueError(f"Missing required variables: {missing_vars}")

        return self.user_message.format(**kwargs)

    @property
    def user_message(self) -> str:
        """Get the user message template."""
        return self.template.user_message

    @property
    def system_message(self) -> str:
        """Get the system message."""
        return self.template.system_message
