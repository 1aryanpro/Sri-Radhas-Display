<script>
    import { supabase } from "$lib/supabase";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

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
        } else {
            goto("/admin");
        }
    }

    function goToDisplay() {
        goto("/display");
    }
</script>

<main class="login-container">
    <h1>Login</h1>
    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}

    <input type="email" placeholder="Email" bind:value={email} />
    <input type="password" placeholder="Password" bind:value={password} />
    <button on:click={handleLogin}>Login</button>

    <hr />
    <button on:click={goToDisplay}>Go to Display Page</button>
</main>

<style>
    * {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
        text-align: center;
    }

    hr {
        margin: 20px;
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

    input,
    button {
        padding: 0.5rem;
        font-size: 1.5rem;
        border-radius: 15px;
    }

    input {
        border: 2px solid grey;
    }

    button {
        border: none;
        background-color: #222222;
        color: white;
        cursor: pointer;
    }
</style>
