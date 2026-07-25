// Single source of truth for the Pickle Coach onboarding video lesson.
// Source video: https://www.youtube.com/watch?v=5-ty-cyg6sI (dinking fundamentals).
// The video has 7 chapters; the intro and the giveaway plug are skipped since
// they teach nothing about pickleball.
export const YOUTUBE_VIDEO_ID = '5-ty-cyg6sI';

export interface LessonSection {
  title: string;
  description: string;
  startSeconds: number;
  endSeconds: number;
}

export const LESSON_SECTIONS: LessonSection[] = [
  {
    title: 'Ready Position',
    description: 'How to stand and hold your paddle before every shot.',
    startSeconds: 36,
    endSeconds: 65,
  },
  {
    title: 'Gripping the Paddle',
    description: 'The right way to hold the paddle when dinking.',
    startSeconds: 65,
    endSeconds: 130,
  },
  {
    title: 'Common Dinking Mistakes',
    description: 'The most common mistakes beginners make, and how to avoid them.',
    startSeconds: 130,
    endSeconds: 163,
  },
  {
    title: 'Pro Dinking Tips',
    description: 'A few simple tips to make your dinks more consistent.',
    startSeconds: 163,
    endSeconds: 213,
  },
  {
    title: 'Protect the Castle Drill',
    description: 'A drill you can practice to sharpen your dinking.',
    startSeconds: 213,
    endSeconds: 312,
  },
];
