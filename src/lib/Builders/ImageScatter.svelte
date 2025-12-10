<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	
	interface Props {
		images?: string[];
		width?: number;
		height?: number;
		minImageSize?: number;
		maxImageSize?: number;
		padding?: number;
		cacheKey?: string; // Unique key for this scatter instance
	}

	let {
		images = [],
		width = 800,
		height = 600,
		minImageSize = 60,
		maxImageSize = 120,
		padding = 20,
		cacheKey = 'default'
	}: Props = $props();

	interface ScatteredImage {
		src: string;
		x: number;
		y: number;
		rotation: number;
		scale: number;
		width: number;
		height: number;
	}

	interface CachedScatterData {
		images: string[];
		width: number;
		height: number;
		minImageSize: number;
		maxImageSize: number;
		padding: number;
		scatteredImages: ScatteredImage[];
		timestamp: number;
	}

	let scatteredImages: ScatteredImage[] = $state([]);
	let previousWidth = $state(width);
	let previousHeight = $state(height);
	let resizeTimeout: ReturnType<typeof setTimeout>;
	let imageDimensionsCache = new Map<string, { width: number; height: number }>();

	// Cache utility functions
	function getCacheKey(): string {
		return `imageScatter_${cacheKey}_${width}x${height}`;
	}

	function saveToCache(data: CachedScatterData): void {
		if (!browser) return;
		try {
			const cacheKey = getCacheKey();
			localStorage.setItem(cacheKey, JSON.stringify(data));
			console.log('Cache saved successfully to key:', cacheKey);
		} catch (error) {
			console.warn('Failed to save scatter cache:', error);
		}
	}

	function loadFromCache(): CachedScatterData | null {
		if (!browser) return null;
		try {
			const cacheKey = getCacheKey();
			const cached = localStorage.getItem(cacheKey);
			if (cached) {
				const data = JSON.parse(cached);
				console.log('Cache loaded from key:', cacheKey, 'with', data.scatteredImages?.length, 'images');
				return data;
			}
			console.log('No cache found for key:', cacheKey);
			return null;
		} catch (error) {
			console.warn('Failed to load scatter cache:', error);
			return null;
		}
	}

	function isCacheValid(cached: CachedScatterData): boolean {
		// Check if cache matches current configuration
		const currentImagesSorted = JSON.stringify([...images].sort());
		const cachedImagesSorted = JSON.stringify([...cached.images].sort());
		
		const isValid = cached.width === width &&
			   cached.height === height &&
			   cached.minImageSize === minImageSize &&
			   cached.maxImageSize === maxImageSize &&
			   cached.padding === padding &&
			   cachedImagesSorted === currentImagesSorted &&
			   Date.now() - cached.timestamp < 24 * 60 * 60 * 1000; // 24 hours
		
		console.log('Cache validation:', {
			width: cached.width === width,
			height: cached.height === height,
			minImageSize: cached.minImageSize === minImageSize,
			maxImageSize: cached.maxImageSize === maxImageSize,
			padding: cached.padding === padding,
			images: cachedImagesSorted === currentImagesSorted,
			age: Date.now() - cached.timestamp < 24 * 60 * 60 * 1000,
			overall: isValid
		});
		
		return isValid;
	}

	// Function to check if two images overlap
	function isOverlapping(
		x1: number,
		y1: number,
		width1: number,
		height1: number,
		x2: number,
		y2: number,
		width2: number,
		height2: number
	): boolean {
		// Simple rectangular overlap detection
		return !(x1 + width1 + padding < x2 || 
				 x2 + width2 + padding < x1 || 
				 y1 + height1 + padding < y2 || 
				 y2 + height2 + padding < y1);
	}

	// Function to find a valid position for an image
	function findValidPosition(
		existingImages: ScatteredImage[],
		imageWidth: number,
		imageHeight: number,
		scale: number,
		maxAttempts: number = 50
	): { x: number; y: number } | null {
		const finalWidth = imageWidth * scale;
		const finalHeight = imageHeight * scale;
		
		// Add wiggle room - allow images to extend slightly beyond boundaries
		const wiggleRoom = Math.min(finalWidth, finalHeight) * 0.3; // 30% of smaller dimension
		
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			let x: number, y: number;
			
			// De-prioritize the middle by using weighted random positioning
			// 70% chance to place in outer areas, 30% chance for anywhere
			if (Math.random() < 0.7) {
				// Prefer edges/corners - choose edge zone first
				const edge = Math.random();
				const centerX = width / 2;
				const centerY = height / 2;
				const edgeZone = Math.min(width, height) * 0.3; // 30% from edges
				
				if (edge < 0.25) {
					// Left edge
					x = Math.random() * edgeZone - wiggleRoom;
					y = Math.random() * (height - finalHeight + wiggleRoom * 2) - wiggleRoom;
				} else if (edge < 0.5) {
					// Right edge
					x = width - edgeZone + Math.random() * edgeZone - wiggleRoom;
					y = Math.random() * (height - finalHeight + wiggleRoom * 2) - wiggleRoom;
				} else if (edge < 0.75) {
					// Top edge
					x = Math.random() * (width - finalWidth + wiggleRoom * 2) - wiggleRoom;
					y = Math.random() * edgeZone - wiggleRoom;
				} else {
					// Bottom edge
					x = Math.random() * (width - finalWidth + wiggleRoom * 2) - wiggleRoom;
					y = height - edgeZone + Math.random() * edgeZone - wiggleRoom;
				}
			} else {
				// Random positioning (original behavior)
				x = Math.random() * (width - finalWidth + wiggleRoom * 2) - wiggleRoom;
				y = Math.random() * (height - finalHeight + wiggleRoom * 2) - wiggleRoom;
			}

			let isValid = true;
			for (const existing of existingImages) {
				if (isOverlapping(x, y, finalWidth, finalHeight, existing.x, existing.y, existing.width * existing.scale, existing.height * existing.scale)) {
					isValid = false;
					break;
				}
			}

			if (isValid) {
				return { x, y };
			}
		}
		return null;
	}

	// Function to load an image and get its dimensions (with caching)
	function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
		// Check if dimensions are already cached
		if (imageDimensionsCache.has(src)) {
			return Promise.resolve(imageDimensionsCache.get(src)!);
		}

		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
				// Cache the dimensions
				imageDimensionsCache.set(src, dimensions);
				resolve(dimensions);
			};
			img.onerror = () => {
				// Fallback to square dimensions if image fails to load
				const fallback = { width: 100, height: 100 };
				imageDimensionsCache.set(src, fallback);
				resolve(fallback);
			};
			img.src = src;
		});
	}

	// Function to calculate scaled dimensions maintaining aspect ratio
	function calculateScaledDimensions(
		originalWidth: number,
		originalHeight: number,
		targetSize: number
	): { width: number; height: number } {
		const aspectRatio = originalWidth / originalHeight;
		
		if (aspectRatio > 1) {
			// Landscape: width is the limiting factor
			return {
				width: targetSize,
				height: targetSize / aspectRatio
			};
		} else {
			// Portrait or square: height is the limiting factor
			return {
				width: targetSize * aspectRatio,
				height: targetSize
			};
		}
	}

	// Function to scatter images
	async function scatterImages() {
		// Only try cache if we're on the client side
		if (!browser) {
			console.log('Not mounted or not in browser, generating new scatter');
			await generateNewScatter();
			return;
		}

		// Try to load from cache first
		const cached = loadFromCache();
		console.log('Cache check:', { cached: !!cached, cacheValid: cached ? isCacheValid(cached) : false });
		
		if (cached && isCacheValid(cached)) {
			console.log('Loading from cache:', cached.scatteredImages.length, 'images');
			scatteredImages = [...cached.scatteredImages]; // Create a new array to ensure reactivity
			console.log('Cache applied, scatteredImages length:', scatteredImages.length);
			return;
		}

		console.log('Generating new scatter layout for', images.length, 'images');
		await generateNewScatter();
	}

	// Separate function for generating new scatter (not cached)
	async function generateNewScatter() {
		scatteredImages = [];

		for (const imageSrc of images) {
			try {
				// Load image dimensions
				const originalDimensions = await loadImageDimensions(imageSrc);
				
				// Calculate target size and scaled dimensions
				const targetSize = minImageSize + Math.random() * (maxImageSize - minImageSize);
				const scaledDimensions = calculateScaledDimensions(
					originalDimensions.width,
					originalDimensions.height,
					targetSize
				);
				
				const rotation = Math.random() * 90 - 45; // Random rotation between -45 and 45 degrees
				const scale = 0.8 + Math.random() * 0.4; // Random scale between 0.8 and 1.2
				
				const position = findValidPosition(scatteredImages, scaledDimensions.width, scaledDimensions.height, scale);

				if (position) {
					scatteredImages.push({
						src: imageSrc,
						x: position.x,
						y: position.y,
						rotation,
						scale,
						width: scaledDimensions.width,
						height: scaledDimensions.height
					});
				} else {
					// If we can't find a valid position, place it randomly with edge preference
					const finalWidth = scaledDimensions.width * scale;
					const finalHeight = scaledDimensions.height * scale;
					const wiggleRoom = Math.min(finalWidth, finalHeight) * 0.3;
					
					let x: number, y: number;
					
					// Even in fallback, prefer edges over center
					if (Math.random() < 0.6) {
						const edge = Math.random();
						const edgeZone = Math.min(width, height) * 0.4; // Slightly larger zone for fallback
						
						if (edge < 0.25) {
							// Left edge
							x = Math.random() * edgeZone - wiggleRoom;
							y = Math.random() * (height - finalHeight + wiggleRoom * 2) - wiggleRoom;
						} else if (edge < 0.5) {
							// Right edge  
							x = width - edgeZone + Math.random() * edgeZone - wiggleRoom;
							y = Math.random() * (height - finalHeight + wiggleRoom * 2) - wiggleRoom;
						} else if (edge < 0.75) {
							// Top edge
							x = Math.random() * (width - finalWidth + wiggleRoom * 2) - wiggleRoom;
							y = Math.random() * edgeZone - wiggleRoom;
						} else {
							// Bottom edge
							x = Math.random() * (width - finalWidth + wiggleRoom * 2) - wiggleRoom;
							y = height - edgeZone + Math.random() * edgeZone - wiggleRoom;
						}
					} else {
						// Random positioning as last resort
						x = Math.random() * (width - finalWidth + wiggleRoom * 2) - wiggleRoom;
						y = Math.random() * (height - finalHeight + wiggleRoom * 2) - wiggleRoom;
					}
					
					scatteredImages.push({
						src: imageSrc,
						x,
						y,
						rotation,
						scale,
						width: scaledDimensions.width,
						height: scaledDimensions.height
					});
				}
			} catch (error) {
				console.warn(`Failed to load image ${imageSrc}, skipping...`);
			}
		}
		
		// Save to cache (only if we have images)
		if (scatteredImages.length > 0) {
			const cacheData: CachedScatterData = {
				images: [...images],
				width,
				height,
				minImageSize,
				maxImageSize,
				padding,
				scatteredImages: [...scatteredImages],
				timestamp: Date.now()
			};
			console.log('Saving to cache:', cacheData.scatteredImages.length, 'images');
			saveToCache(cacheData);
		}

		scatteredImages = scatteredImages;
	}

	// Debounced function to handle dimension changes
	function debouncedResize() {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			scatterImages();
		}, 150); // Wait 150ms after resize stops
	}

	// Re-scatter when dimensions change (debounced) - but only if not loading from cache
	run(() => {
		if (browser && (width !== previousWidth || height !== previousHeight)) {
			const cached = browser ? loadFromCache() : null;
			const shouldUseCache = cached && isCacheValid(cached);
			
			previousWidth = width;
			previousHeight = height;
			
			if (!shouldUseCache) {
				debouncedResize();
			}
		}
	});

	let mounted = $state(false);

	// Handle client-side mounting
	onMount(() => {
		// Trigger initial scatter if we have images
		mounted = true;
	});

	let initialized = $state(false);

	run(() => {
		if(!initialized && mounted && width != -1 && height != -1) {
			initialized = true;

			if (images.length > 0) {
				scatterImages();
			}
		}
	});

	// Function to re-scatter images manually
	export function reshuffle() {
		// Clear cache when manually reshuffling
		if (browser) {
			localStorage.removeItem(getCacheKey());
		}
		generateNewScatter();
	}

	// Cleanup timeout on component destroy
	onDestroy(() => {
		if (resizeTimeout) {
			clearTimeout(resizeTimeout);
		}
	});
</script>

<div
	class="image-scatter-container"
	style="width: {width}px; height: {height}px;"
>
	{#each scatteredImages as image, index}
		<img
			src={image.src}
			alt="Scattered image {index + 1}"
			class="scattered-image"
			style="
				left: {image.x}px;
				top: {image.y}px;
				width: {image.width}px;
				height: {image.height}px;
				--base-rotation: {image.rotation}deg;
				--scale: {image.scale};
				--animation-duration: {15 + Math.random() * 20}s;
				--rotation-direction: {Math.random() > 0.5 ? 1 : -1};
			"
			loading="lazy"
		/>
	{/each}
</div>

<style>
	.image-scatter-container {
		position: relative;
		overflow: hidden;
	}

	.scattered-image {
		position: absolute;
		object-fit: cover;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
		cursor: pointer;
		animation: gentleRotate var(--animation-duration) ease-in-out infinite alternate;
	}

	@keyframes gentleRotate {
		0% {
			transform: rotate(calc(var(--base-rotation) - (5deg * var(--rotation-direction)))) scale(var(--scale, 1));
		}
		100% {
			transform: rotate(calc(var(--base-rotation) + (5deg * var(--rotation-direction)))) scale(var(--scale, 1));
		}
	}

	.scattered-image:hover {
		animation-play-state: paused;
		transform: rotate(0deg) scale(1.1) !important;
		z-index: 10;
	}
</style>
