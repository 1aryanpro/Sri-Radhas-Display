<script>
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    let user = null;
    let file = null;
    let uploadMessage = "";
    let fileList = [];

    const BUCKET_NAME = "carousel";

    onMount(async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) goto("/");
        else {
            user = session.user;
            await loadFiles();
        }
    });

    async function loadFiles() {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list("", { limit: 100 });

        if (error) {
            console.error("Error loading files:", error.message);
            fileList = [];
        } else {
            fileList = data.filter(
                (file) => file.name !== ".emptyFolderPlaceholder",
            );
        }
    }

    async function deleteFile(fileName) {
        const conf = window.confirm(
            `Are you sure you want to delete ${fileName}`,
        );
        if (!conf) return;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([fileName]);

        if (error) {
            console.error("Failed to delete", fileName, error.message);
        } else {
            fileList = fileList.filter((file) => file.name !== fileName);
        }
    }

    function getFileUrl(fileName) {
        return supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName).data
            .publicUrl;
    }

    function getFormattedDate() {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}${mm}${dd}`;
    }

    async function uploadFile() {
        file = event.target.files[0];

        if (!file) {
            uploadMessage = "Please select a file first.";
            return;
        }

        const formattedDate = getFormattedDate();
        const fileExtension = file.name.split(".").pop();
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const fileName = `${formattedDate}_${baseName}.${fileExtension}`;

        const imageTypes = ["jpg", "jpeg", "png", "pdf"];
        if (imageTypes.indexOf(fileExtension) == -1) {
            uploadMessage = `Please select an image. A ${fileExtension} type file isn't accepted.`;
            return;
        }

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file);

        if (error) {
            uploadMessage = `Upload failed: ${error.message}`;
        } else {
            uploadMessage = `Uploaded successfully as: ${fileName}`;
            loadFiles();
        }
    }
</script>

<h2>Upload a file</h2>

<div class="upload-container">
    <input type="file" id="fileUpload" on:change={uploadFile} hidden />
    <label for="fileUpload" class="upload-button">📁 Upload Image</label>
</div>
{#if uploadMessage}
    <p><span>{uploadMessage}</span></p>
{/if}

<h2>Uploaded Files</h2>
<div class="grid">
    {#each fileList as file}
        <div class="card">
            <div class="image-wrapper">
                <img
                    src={supabase.storage
                        .from(BUCKET_NAME)
                        .getPublicUrl(file.name).data.publicUrl}
                    alt={file.name}
                />
                <button on:click={() => deleteFile(file.name)}>X</button>
            </div>
        </div>
    {/each}
</div>

<style>
    * {
        font-family: sans-serif;
    }

    .upload-container {
        display: flex;
        justify-content: center;
        margin: 1rem 0;
    }

    p {
        text-align: center;
        margin-top: 2rem;
    }

    span {
        padding: 1rem;
        margin: auto;
        background-color: #8cff7c;
        border-radius: 0.5rem;
    }

    h2 {
        text-align: center;
        margin: 2rem 0;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 1rem;
    }

    .card {
        background: #dddddd;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }

    .image-wrapper {
        position: relative;
        width: 100%;
    }

    img {
        width: 100%;
        max-height: 200px;
        object-fit: cover;
        border-radius: 8px;
        display: block;
        border: 4px solid black;
    }

    label {
        cursor: pointer;
        padding: 0.5rem 1rem;
        font-size: 1.5rem;
        border-radius: 15px;
        border: none;
        background-color: #222222;
        color: white;
    }

    label:hover {
        background: #888888;
    }

    button {
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(200, 200, 200, 0.9); /* red with some transparency */
        border: none;
        padding: 0.3rem 0.6rem;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        font-size: 1.1rem;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        transition: background 0.2s ease-in-out;
    }

    button:hover {
        background: rgba(201, 48, 44, 1);
    }
</style>
