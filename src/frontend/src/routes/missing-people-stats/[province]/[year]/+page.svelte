<svelte:head>
    <title>Editar dato</title>
</svelte:head>

<script>
    //@ts-nocheck
    import {dev} from "$app/environment";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
    import { onMount } from "svelte";

    let DEVEL_HOST = "http://localhost:16078";
    let API = `/api/v2/missing-people-stats/${page.params.province}/${page.params.year}`;
    if(dev) API = DEVEL_HOST + API

    //Data and status
    let missingData = {};
    let isLoading = false;
    let userMessage = {text: "", type: ""};

    //Vars to edit
    let newMissingYear;
    let newMissingProvince;
    let newMissingMen;
    let newMissingWomen;
    let newMissingUnknown;
    let newMissingTotalPopulation;

    function showMessage(text, type = "info", duration = 5000) {
        userMessage = { text, type };
        if (duration > 0) {
            setTimeout(() => userMessage.text = "", duration);
        }
    }

    function translateError(error) {
        if (error.includes("404")) return "No se encontró la desaparición";
        if (error.includes("400")) return "Datos inválidos";
        if (error.includes("500")) return "Error del servidor";
        return "Error inesperado";
    }

    async function getMissing() {
        isLoading = true;
        try {
            const res = await fetch(API, { method: "GET" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            missingData = await res.json();

            newMissingProvince = missingData.province;
            newMissingYear = missingData.year;
            newMissingMen = missingData.missing_men;
            newMissingWomen = missingData.missing_women;
            newMissingUnknown = missingData.missing_unknown;
            newMissingTotalPopulation = missingData.total_population;
        } catch (error) {
            console.error("Error:", error);
            showMessage(translateError(error.message), "error");
        } finally{
            isLoading = false;
        }
    }

    async function updateMissing() {
        isLoading = true;
        showMessage("Actualizando desaparición...", "info");

        try {
            const payload = {
                year: missingData.year,
                province: missingData.province,
                missing_men: Number(newMissingMen) || 0,
                missing_women: Number(newMissingWomen) || 0,
                missing_unknown: Number(newMissingUnknown) || 0,
                total_population: Number(newMissingTotalPopulation) || 0
            };

            const res = await fetch(API, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            if(res.ok){
                showMessage("Desaparcion actualizada correctamente", "success")
                setTimeout(() => goto("/missing-people-stats"),1500);
            }else{
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }
        } catch (error) {
            console.error("Error:", error);
            showMessage("Error al actualizar: " + translateError(error.message), "error");
        } finally {
            isLoading = false;
        }
    }

    async function deleteMissing() {
        isLoading = true;
        showMessage("Eliminando desaparicion...", "info");
        
        try {
            const res = await fetch(API, { method: "DELETE" });
            
            if (res.ok) {
                showMessage("Desaparicion eliminada correctamente", "success");
                setTimeout(() => goto("/missing-people-stats"), 1500);
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (error) {
            console.error("Error:", error);
            showMessage("Error al eliminar: " + translateError(error.message), "error");
        } finally {
            isLoading = false;
        }
    }

    onMount(async () => {
        await getMissing();
    });
</script>

<div class="edit-container">
    <h1>Editar datos de {missingData.province} ({missingData.year})</h1>

    {#if isLoading}
        <p class="loading">Cargando...</p>
    {:else}
        <form on:submit|preventDefault={updateMissing}>
            <div class="form-group">
                <label for="men">Hombres desaparecidos:</label>
                <input type="number" id="men" bind:value={newMissingMen} min="0">
            </div>

            <div class="form-group">
                <label for="women">Mujeres desaparecidas:</label>
                <input type="number" id="women" bind:value={newMissingWomen} min="0">
            </div>

            <div class="form-group">
                <label for="unknown">Desconocidos:</label>
                <input type="number" id="unknown" bind:value={newMissingUnknown} min="0">
            </div>

            <div class="form-group">
                <label for="population">Población total:</label>
                <input type="number" id="population" bind:value={newMissingTotalPopulation} min="0">
            </div>

            <div class="button-group">
                <button type="submit" class="primary">Guardar cambios</button>
                <button type="button" on:click={() => goto('/missing-people-stats')} class="secondary">Cancelar</button>
                <button type="button" on:click={deleteMissing} class="danger">Eliminar registro</button>
            </div>
        </form>
    {/if}

    {#if userMessage.text}
        <div class:notification-success={userMessage.type === 'success'} 
             class:notification-error={userMessage.type === 'error'}>
            {userMessage.text}
        </div>
    {/if}
</div>

<style>
    .edit-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    h1 {
        color: #2c3e50;
        margin-bottom: 2rem;
        text-align: center;
    }

    .loading {
        text-align: center;
        font-size: 1.2rem;
        color: #7f8c8d;
    }

    form {
        background: #f9f9f9;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #34495e;
    }

    input {
        width: 100%;
        padding: 0.8rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    .button-group {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
        gap: 1rem;
    }

    button {
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
        flex: 1;
    }

    .primary {
        background-color: #3498db;
        color: white;
    }

    .primary:hover {
        background-color: #2980b9;
    }

    .secondary {
        background-color: #95a5a6;
        color: white;
    }

    .secondary:hover {
        background-color: #7f8c8d;
    }

    .danger {
        background-color: #e74c3c;
        color: white;
    }

    .danger:hover {
        background-color: #c0392b;
    }

    .notification-success, .notification-error {
        padding: 1rem;
        margin-top: 1.5rem;
        border-radius: 4px;
        text-align: center;
    }

    .notification-success {
        background-color: #d4edda;
        color: #155724;
        border-left: 4px solid #28a745;
    }

    .notification-error {
        background-color: #f8d7da;
        color: #721c24;
        border-left: 4px solid #dc3545;
    }
</style>