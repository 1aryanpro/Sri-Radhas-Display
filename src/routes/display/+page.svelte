<script>
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";

    let images = [];
    let current = 0;
    let interval;

    const BUCKET_NAME = "carousel";

    onMount(async () => {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list("", { limit: 100 });

        if (error) {
            console.error("Error fetching images:", error.message);
        } else {
            images = data
                .filter((file) => file.name !== ".emptyFolderPlaceholder")
                .filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name))
                .map(
                    (file) =>
                        supabase.storage
                            .from(BUCKET_NAME)
                            .getPublicUrl(file.name).data.publicUrl,
                );

            startCarousel();
        }

        return () => clearInterval(interval);
    });

    function startCarousel() {
        interval = setInterval(() => {
            current = (current + 1) % images.length;
        }, 10*1000);
    }
</script>

<div class="page">
    <div class="carousel">
        <img src={images[current]} alt="Carousel" />
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
    }

    img {
        width: 100%;
        object-fit: contain;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        transition: opacity 0.5s ease-in-out;
    }
</style>

