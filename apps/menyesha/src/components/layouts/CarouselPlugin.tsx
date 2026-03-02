"use client";

import * as React from "react";
import Image from "next/image";

const newsStories = [
	{
		id: 1,
		title: "Breaking: Global Climate Summit Reaches Historic Agreement",
		description:
			"World leaders unite on unprecedented climate action plan for the next decade, setting new environmental standards",
		image: "https://picsum.photos/1200/600?random=1",
		category: "Environment",
		isBreaking: true,
		publishedAt: "2 min ago",
		views: "15.2K",
		comments: 342,
		author: "Sarah Chen",
		readTime: "3 min read",
	},
	{
		id: 2,
		title: "Tech Giants Announce Revolutionary AI Partnership",
		description:
			"Major technology companies collaborate on next-generation artificial intelligence breakthrough",
		image: "https://picsum.photos/1200/600?random=2",
		category: "Technology",
		isHot: true,
		publishedAt: "15 min ago",
		views: "8.7K",
		comments: 189,
		author: "Marcus Rodriguez",
		readTime: "5 min read",
	},
	{
		id: 3,
		title: "Economic Markets Show Strong Recovery Signs",
		description:
			"Global markets demonstrate resilience amid challenging economic conditions worldwide",
		image: "https://picsum.photos/1200/600?random=3",
		category: "Business",
		publishedAt: "32 min ago",
		views: "12.1K",
		comments: 276,
		author: "David Kim",
		readTime: "4 min read",
	},
];

export function CarouselPlugin() {
	const [currentIndex, setCurrentIndex] = React.useState(0);

	React.useEffect(() => {
		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % newsStories.length);
		}, 5000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className="relative w-full h-full min-h-[280px] bg-gray-900 overflow-hidden rounded-lg">
			{newsStories.map((story, index) => (
				<div
					key={story.id}
					className={`absolute inset-0 transition-opacity duration-1000 ${
						index === currentIndex ? "opacity-100" : "opacity-0"
					}`}
				>
					<div className="relative w-full h-full">
						<Image
							src={story.image}
							alt={story.title}
							fill
							className="object-cover"
							priority={index === 0}
							sizes="100vw"
							onError={() =>
								console.error(`Failed to load image: ${story.image}`)
							}
							onLoad={() =>
								console.log(`Successfully loaded image: ${story.image}`)
							}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

						{/* Content - More Compact */}
						<div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white z-10">
							<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
								{story.isBreaking && (
									<span className="bg-error text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse inline-block w-fit">
										Breaking News
									</span>
								)}
								{story.isHot && !story.isBreaking && (
									<span className="bg-orange-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block w-fit">
										🔥 Hot
									</span>
								)}
								<span className="bg-brand-primary text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block w-fit">
									{story.category}
								</span>
							</div>

							
							<h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-2 sm:mb-3 leading-tight">
								{story.title}
							</h2>

							<p className="text-gray-200 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed line-clamp-2">
								{story.description}
							</p>

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
								<div className="flex items-center space-x-2 sm:space-x-3">
									<div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
										<span className="text-xs sm:text-sm font-bold">
											{story.author
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</span>
									</div>
									<div className="min-w-0">
										<div className="font-semibold text-sm sm:text-base truncate">{story.author}</div>
										<div className="text-xs sm:text-sm opacity-75">
											{story.publishedAt} • {story.readTime}
										</div>
									</div>
								</div>

								<div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm opacity-90">
									<span>{story.views} views</span>
									<span>{story.comments} comments</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			))}

			{/* Navigation Dots */}
			<div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
				{newsStories.map((_, index) => (
					<button
						key={index}
						onClick={() => setCurrentIndex(index)}
						className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
							index === currentIndex
								? "bg-white"
								: "bg-white/50 hover:bg-white/75"
						}`}
					/>
				))}
			</div>

			{/* Navigation Arrows */}
			<button
				onClick={() =>
					setCurrentIndex(
						(prev) => (prev - 1 + newsStories.length) % newsStories.length
					)
				}
				className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all z-20 text-lg sm:text-xl font-bold"
			>
				←
			</button>
			<button
				onClick={() =>
					setCurrentIndex((prev) => (prev + 1) % newsStories.length)
				}
				className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all z-20 text-lg sm:text-xl font-bold"
			>
				→
			</button>
		</div>
	);
}
