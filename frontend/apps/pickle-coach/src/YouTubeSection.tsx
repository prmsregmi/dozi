import { YOUTUBE_VIDEO_ID, type LessonSection } from './content';

interface YouTubeSectionProps {
  section: LessonSection;
}

export default function YouTubeSection({ section }: YouTubeSectionProps) {
  const src = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?start=${section.startSeconds}&end=${section.endSeconds}&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-sm">
      <iframe
        key={section.title}
        className="w-full h-full"
        src={src}
        title={section.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
