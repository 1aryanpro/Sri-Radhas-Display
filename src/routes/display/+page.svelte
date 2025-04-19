<script>
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import Carousel from "svelte-carousel/src/components/Carousel/Carousel.svelte";

    let images = [];
    let current = 0;
    let interval;

    const BUCKET_NAME = "carousel";

    onMount(async () => {
        if (updateImages()) startCarousel();

        return () => clearInterval(interval);
    });

    async function updateImages() {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list("", { limit: 100 });

        if (error) {
            console.error("Error fetching images:", error.message);
            return false;
        }

        images = data
            .filter((file) => file.name !== ".emptyFolderPlaceholder")
            .filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name))
            .map(
                (file) =>
                    supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name)
                        .data.publicUrl,
            );

        if (current >= images.length) current = 0;
        return true;
    }

    let progress = 0;
    let progressInterval,
        progressStep = 1000,
        resetting = false;

    const imageTime = 30 * 1000;

    function startCarousel() {
        updateProgress();
    }

    function updateProgress() {
        progressInterval = setInterval(() => {
            progress += (progressStep / imageTime) * 100;
            if (progress > 100) {
                clearInterval(progressInterval);
                current = (current + 1) % images.length;
                resetProgress();
                updateImages();
            }
        }, progressStep);
    }

    function resetProgress() {
        resetting = true;
        progress = 0;

        requestAnimationFrame(() => {
            resetting = false;
            updateProgress();
        });

        clearInterval(progressInterval);
    }
</script>

<div class="page">
    <div class="carousel">
        <img src={images[current]} alt="Carousel" />
        <div class="progress-bar-container">
            <div
                class="progress-bar"
                class:resetting-bar={resetting}
                style="width: {progress}%; transition:
            width {progressStep}ms linear;"
            ></div>
        </div>
    </div>
</div>

<style>
    * {
        margin: 0;
        padding: 0;
    }

    .page {
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000;
    }

    .carousel {
        width: 100%;
        position: relative;
    }

    img {
        width: 100%;
        object-fit: contain;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        transition: opacity 0.5s ease-in-out;
    }

    .progress-bar-container {
        height: 1vh;
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        overflow: hidden;
    }

    .progress-bar {
        height: 1vh;
        background: #00bfff;
    }

    .resetting-bar {
        transition: none !important;
    }
</style>
