<script>
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import Carousel from "svelte-carousel/src/components/Carousel/Carousel.svelte";

    let images = [];
    let current = 0;

    let progressStep = 1000;
    const imageTime = 20 * 1000;

    let progressInterval;
    let progress = 0;
    let resetting = false;

    const BUCKET_NAME = "carousel";

    onMount(async () => {
        if (await updateImages()) updateProgress();
        requestWakeLock();

        return () => {
            clearInterval(interval);
            releaseWakeLock();
        };
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
            .map(
                (file) =>
                    supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name)
                        .data.publicUrl,
            );

        if (current >= images.length) current = 0;
        return true;
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

        if (wakeLock == null) requestWakeLock();

        requestAnimationFrame(() => {
            resetting = false;
            updateProgress();
        });

        clearInterval(progressInterval);
    }

    let wakeLock = null;

    async function requestWakeLock() {
        if (wakeLock != null) return;

        if (!("wakeLock" in navigator)) {
            console.warn("Wake Lock API is not supported in this browser.");
            return;
        }

        try {
            wakeLock = await navigator.wakeLock.request("screen");
            console.log("Wake lock is active");

            // Reacquire wake lock if it is released (e.g., due to visibility change)
            document.addEventListener("visibilitychange", async () => {
                if (
                    wakeLock != null &&
                    document.visibilityState == "visible"
                ) {
                    wakeLock = await navigator.wakeLock.request("screen");
                    console.log("Wake lock reacquired");
                }
            });
        } catch (err) {
            console.error("Failed to acquire wake lock:", err);
        }
    }

    function releaseWakeLock() {
        if (wakeLock) {
            wakeLock.release().then(() => {
                console.log("Wake lock released");
                wakeLock = null;
            });
        }
    }
</script>

<div class="page">
    {#if images.length > 0}
        <div class="carousel">
            <img src={images[current]} alt="Carousel Content" />
            <div class="progress-bar-container">
                <div
                    class="progress-bar"
                    class:resetting-bar={resetting}
                    style="width: {progress}%; transition:
            width {progressStep}ms linear;"
                ></div>
            </div>
        </div>
    {/if}
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
        height: 100vh;
        width: 100%;
        max-width: 100vw;
        object-fit: contain;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        transition: opacity 0.5s ease-in-out;
    }

    .progress-bar-container {
        position: absolute;
        bottom: 0;
        left: 0;
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
