<script>
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    let email = "";
    let password = "";
    let errorMessage = "";

    async function handleLogin() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const { error } = await supabase.auth.signInWithPassword({
            email: emailPattern.test(email) ? email : email + "@sriradhas.com",
            password,
        });

        if (error) {
            errorMessage = error.message;
            return;
        }

        loggedIn = true;
    }

    let uploadMessage = "";
    let fileList = [];
    let changes = false;
    let loggedIn = false;

    const BUCKET_NAME = "carousel";

    onMount(async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session) loggedIn = true;
        await loadFiles();
    });

    async function loadFiles() {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list("", { limit: 100 });

        if (error) {
            console.error("Error loading files:", error.message);
            fileList = [];
            return;
        }

        let { data: carousel, error: e } = await supabase
            .from("Carousel")
            .select("*");

        let carouselMap = new Map(carousel.map((c) => [c.id, c]));

        fileList = data.filter(
            (file) => file.name !== ".emptyFolderPlaceholder",
        );

        fileList = fileList.map((file) => {
            let name = file.name;
            let id = file.id;

            let c = carouselMap.get(id);
            let order = c.order;
            let star = c.star;
            let time = c.time;
            let url = getFileUrl(name);

            return { name, id, order, star, time, url };
        });

        fileList.sort((a, b) =>
            a.star == b.star ? a.order - b.order : a.star ? -1 : 1,
        );

        fileList.forEach((file, i) => {
            if (file.order == i) return;
            changes = true;
            file.order = i;
        });

        if (changes) saveChanges();
    }

    async function deleteFile(index) {
        let fileName = fileList[index].name;
        const conf = window.confirm(
            `Are you sure you want to delete ${fileName}`,
        );
        if (!conf) return;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([fileName]);

        if (error) {
            console.error("Failed to delete", fileName, error.message);
            return;
        }

        fileList = fileList.filter((file) => file.name !== fileName);
    }

    function getFileUrl(fileName) {
        return supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName).data
            .publicUrl;
    }

    async function uploadFile() {
        let file = event.target.files[0];

        if (!file) {
            uploadMessage = "Please select a file first.";
            return;
        }

        const fileExtension = file.name.split(".").pop();
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const fileName = `${baseName}.${fileExtension}`;

        const imageTypes = ["jpg", "jpeg", "png"];
        if (fileExtension == "pdf") {
            uploadMessage = `PDF Files are not supported. Please convert them to
a PNG here. <a href="https://www.freeconvert.com/pdf-to-png"
target="_blank">Free Convert</a>`;
            return;
        }

        if (imageTypes.indexOf(fileExtension) == -1) {
            uploadMessage = `Please select an image. A ${fileExtension} type file isn't accepted.`;
            return;
        }

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file);

        if (error) {
            uploadMessage = `Upload failed: ${error.message}`;
            return;
        }

        await supabase.from("Carousel").insert([{ id: data.id, order: 0 }]);

        uploadMessage = `Uploaded successfully as: ${fileName}`;
        loadFiles();
    }

    function toggleStar(index) {
        fileList[index].star = !fileList[index].star;
        changes = true;
    }

    function move(index, dir) {
        let a = index;
        let b = dir ? a + 1 : a - 1;

        if (b == -1 || b == fileList.length) return;
        changes = true;

        let fileA = fileList[a];
        let fileB = fileList[b];

        let temp = fileA.order;
        fileA.order = fileB.order;
        fileB.order = temp;

        [fileList[a], fileList[b]] = [fileList[b], fileList[a]];
        fileList = [...fileList];
    }

    async function saveChanges() {
        await fileList.map(async (file) => {
            await supabase
                .from("Carousel")
                .update({ order: file.order, star: file.star, time: file.time })
                .eq("id", file.id);
        });

        changes = false;
    }
</script>

{#if loggedIn}
    <h2>Upload a file</h2>

    <div class="upload-container">
        <input type="file" id="fileUpload" on:change={uploadFile} hidden />
        <label for="fileUpload" class="upload-button">📁 Upload Image</label>
    </div>
    {#if uploadMessage}
        <p><span>{@html uploadMessage}</span></p>
    {/if}

    <h2>Carousel</h2>

    <table>
        <tbody>
            {#each fileList as file, i}
                <tr>
                    <td
                        ><button class="star" on:click={() => toggleStar(i)}
                            >{file.star ? "★" : "☆"}</button
                        ></td
                    >
                    <td><img src={file.url} alt={file.name} /></td>
                    <td>
                        <input
                            type="number"
                            bind:value={file.time}
                            on:focus={() => (changes = true)}
                        />
                    </td>
                    <td>
                        <button on:click={() => deleteFile(i)}>🗑️</button>
                    </td>
                    <td>
                        <button on:click={() => move(i, false)}>🔼</button>
                        <button on:click={() => move(i, true)}>🔽</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>

    <div class="save-container">
        <button class="save" on:click={saveChanges}
            >{changes ? "💾 Save Changes" : "No Changes to Save"}</button
        >
        <!-- Log Out Button -->
        <!-- <button -->
        <!--     class="save" -->
        <!--     on:click={async () => { -->
        <!--         await supabase.auth.signOut(); -->
        <!--         loggedIn = false; -->
        <!--     }}>Log Out</button -->
        <!-- > -->
    </div>
{:else}
    <main class="login-container">
        <h1>Login</h1>
        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}

        <input type="email" placeholder="Email" bind:value={email} />
        <input type="password" placeholder="Password" bind:value={password} />
        <button on:click={handleLogin}>Login</button>
    </main>
{/if}

<style>
    * {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
        text-align: center;
    }

    .upload-container,
    .save-container {
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

    img {
        max-height: 100px;
        object-fit: cover;
        border-radius: 8px;
        display: block;
        border: 2px solid black;
        margin: auto;
    }

    input {
        font-size: 2rem;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: 2px solid black;
    }

    table input {
        width: 75%;
    }

    button {
        border: none;
        font-size: 2.5rem;
        background: none;
        cursor: pointer;
    }

    input,
    button {
        padding: 0.5rem;
        font-size: 1.5rem;
        border-radius: 15px;
        cursor: pointer;
    }

    .login-container button {
        border: none;
        background-color: #222222;
        color: white;
        cursor: pointer;
    }

    button.star {
        color: orange;
    }

    label,
    button.save {
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

    table {
        border-collapse: collapse;
        width: 80%;
        margin: auto;
    }

    td {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
        text-align: center;
    }

    .login-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 300px;
        margin: 5rem auto;
    }

    .error {
        background-color: #ff7f7f;
        padding: 0.5rem;
        border-radius: 10px;
    }
</style>
