<svelte:head>
    <title>Missing People Stats</title>
</svelte:head>

<script>
    //@ts-nocheck
    import {dev} from "$app/environment";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let DEVEL_HOST = "http://localhost:16078";
    let API = "/api/v2/missing-people-stats";
    if(dev) API = DEVEL_HOST + API

    //Data and status

    let missingData = [];
    let filteredData = [];
    let isLoading = false;
    let userMessage = { text: "", type:""};

    //Variables to create
    let newMissingYear;
    let newMissingProvince;
    let newMissingMen;
    let newMissingWomen;
    let newMissingUnknown;
    let newMissingTotalPopulation;

    //Variables to filter
    let filterField = "province"
    let filterValue = "";
    let minYear = "";
    let maxYear = "";

    //Variables for pagination
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalPages = 1;
    let paginatedData = [];

    //Auxiliar functions
    function updatePagination() {
        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showMessage(text, type = "info", duration = 5000) {
        userMessage = { text, type };
        if (duration > 0) {
            setTimeout(() => userMessage.text = "", duration);
        }
    }

    function translateError(error) {
        if (error.includes("404")) return "Datos no encontrados";
        if (error.includes("400")) return "Datos inválidos";
        if (error.includes("500")) return "Error del servidor";
        return "Error inesperado";
    }

    //Operaciones

    async function refreshData(showSuccess = true) {
        isLoading = true;
        try {
            const res = await fetch(API, { method: "GET" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            missingData = await res.json();
            filteredData = [...missingData];
            updatePagination();
            
            if (showSuccess) showMessage("Datos cargados correctamente", "success");
        } catch (error) {
            console.error("Error:", error);
            showMessage(translateError(error.message), "error");
        } finally {
            isLoading = false;
        }
    }

    async function createMissing() {
        if (!newMissingYear || !newMissingProvince) {
                showMessage("Año y Provincia son obligatorios", "error");
                return;
            }
        
        isLoading = true;
        showMessage("Creando desaparicion...", "info");

        try {
            const res = await fetch(API, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    year: Number(newMissingYear),
                    province: newMissingProvince,
                    missing_men: Number(newMissingMen),
                    missing_women: Number(newMissingWomen),
                    missing_unknown: Number(newMissingUnknown),
                    total_population: Number(newMissingTotalPopulation)

                })
            });
        
        if (res.ok){
            await refreshData(false);
            showMessage("Desaparcion creada con exito", "success")
            //Reset fields
            newMissingYear = "";
            newMissingProvince = "";
            newMissingMen = "";
            newMissingWomen = "";
            newMissingUnknown = "";
            newMissingTotalPopulation = "";
        }else{
            throw new Error(`HTTP ${res.status}`);
        }
        } catch (error) {
            console.error("Error:", error);
            showMessage("Error al crear la desaparicion: " + translateError(error.message), "error");
        } finally{
            isLoading = false;
        }
    }

    async function deleteMissing(province, year) {
        isLoading = true;
        showMessage("Eliminando desaparicion...", "info");
        
        try {
           const res = await fetch(`${API}/${province}/${year}`, { method: "DELETE" });
            
            if (res.ok) {
                await refreshData(false);
                showMessage("Desaparicion eliminada correctamente", "success");
            } else {
                throw new Error(`HTTP ${res.status}`);
            } 
        } catch (error) {
            console.error("Error:", error);
            showMessage("Error al eliminar la desaparicion: " + translateError(error.message), "error");
        } finally{
            isLoading = false;
        }
    }

    async function deleteData() {
        if (!confirm("¿Desea eliminar todos los datos?")) return;
        
        isLoading = true;
        showMessage("Eliminando todos los datos...", "info");
        
        try {
            const res = await fetch(API, { method: "DELETE" });
            
            if (res.ok) {
                await refreshData(false);
                showMessage("Todos los datos han sido eliminados", "success");
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (error) {
            console.error("Error:", error);
            showMessage("Error al eliminar datos: " + translateError(error.message), "error");
        } finally {
            isLoading = false;
        }
    }

    async function filterByField(){
        if (!filterField || filterValue === "") {
            filteredData = [...missingData];
            currentPage = 1;
            updatePagination();
            showMessage("Filtro limpiado", "info");
            return;
        }

        isLoading = true;
        showMessage(`Aplicando filtro por ${filterField}...`, "info");

        try {
            filteredData = missingData.filter(item => {
                const fieldValue = item[filterField];
                if (fieldValue == undefined) return false;

                if(typeof fieldValue === 'number'){
                    return fieldValue === Number(filterValue);
                }
                return fieldValue.toString().toLowerCase().includes(filterValue.toLowerCase());
            });

            currentPage = 1;
            updatePagination();
            
            if (filteredData.length === 0) {
                showMessage("No se encontraron resultados", "info");
            } else {
                showMessage(`${filteredData.length} resultados encontrados`, "success");
            }
        } catch (error) {
            console.error("Error al filtrar:", error);
            showMessage("Error al aplicar filtro", "error");
        } finally{
            isLoading = false;
        }
    }
    
    async function searchByYearRange() {
        if (!minYear && !maxYear){
            filteredData = [...missingData];
            currentPage = 1;
            updatePagination();
            showMessage("Búsqueda limpiada", "info");
            return;
        }
        
        isLoading = true;
        showMessage("Buscando...", "info");

        try {
            const min = minYear ? Number(minYear) : 0;
            const max = maxYear ? Number(maxYear) : Infinity;

            filteredData = missingData.filter(item => {
                return item.year >= min && item.year <=max;
            });

            currentPage = 1;
            updatePagination();

            if (filteredData.length === 0) {
                showMessage("No se encontraron resultados", "info");
            } else {
                showMessage(`${filteredData.length} resultados encontrados`, "success");
            }
        } catch (error) {
            console.error("Error en búsqueda:", error);
            showMessage("Error al buscar", "error");
        } finally{
            isLoading = false;
        }
    }

    //Initialization
    onMount(async () => {
        await refreshData(true);
    });
</script>

<h1>📊 Estadísticas de Personas Desaparecidas</h1>

<section class="form-section">
  <h2>➕ Añadir Nuevos Datos</h2>
  <form on:submit|preventDefault={createMissing}>
    <input type="number" placeholder="Año" bind:value={newMissingYear} required min="2000" max="2050" />
    <input placeholder="Provincia" bind:value={newMissingProvince} required />
    <input type="number" placeholder="Hombres desaparecidos" bind:value={newMissingMen} min="0" />
    <input type="number" placeholder="Mujeres desaparecidas" bind:value={newMissingWomen} min="0" />
    <input type="number" placeholder="Desconocidos" bind:value={newMissingUnknown} min="0" />
    <input type="number" placeholder="Población total" bind:value={newMissingTotalPopulation} min="0" />
    <button>Crear</button>
  </form>
</section>

<section class="filter-section">
  <h2>🔍 Filtrar Datos</h2>
  <div class="filter-group">
    <select bind:value={filterField}>
      <option value="province">Provincia</option>
      <option value="year">Año</option>
    </select>
    <input placeholder="Valor a buscar" bind:value={filterValue} />
    <button on:click={filterByField}>Filtrar</button>
  </div>
  
  <div class="filter-group">
    <input type="number" placeholder="Año mínimo" bind:value={minYear} min="2000" max="2050" />
    <input type="number" placeholder="Año máximo" bind:value={maxYear} min="2000" max="2050" />
    <button on:click={searchByYearRange}>Buscar por rango</button>
  </div>
  
  <button class="danger" on:click={deleteData}>Eliminar todos los datos</button>
</section>

{#if userMessage.text}
  <div class:success={userMessage.type === 'success'} class:error={userMessage.type === 'error'}>
    {userMessage.text}
  </div>
{/if}

<section class="data-section">
  <h2>📋 Datos</h2>
  
  {#if isLoading}
    <p>Cargando datos...</p>
  {:else if filteredData.length === 0}
    <p>No hay datos disponibles</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Año</th>
          <th>Provincia</th>
          <th>Hombres</th>
          <th>Mujeres</th>
          <th>Desconocidos</th>
          <th>Población Total</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each paginatedData as item}
          <tr>
            <td>{item.year}</td>
            <td>{item.province}</td>
            <td>{item.missing_men}</td>
            <td>{item.missing_women}</td>
            <td>{item.missing_unknown}</td>
            <td>{item.total_population}</td>
            <td>
              <button class="danger" on:click={() => deleteMissing(item.province, item.year)}>Eliminar</button>
              <button class="edit" on:click={() => goto(`/missing-people-stats/${item.province}/${item.year}`)}>Editar</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="pagination">
      <div class="pagination-info">
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}-
        {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
      </div>
      
      <div class="pagination-buttons">
        <button on:click={() => goToPage(1)} disabled={currentPage === 1}>
          Primera
        </button>
        <button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
          Anterior
        </button>
        <span class="page-indicator">Página {currentPage} de {totalPages}</span>
        <button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
          Siguiente
        </button>
        <button on:click={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
          Última
        </button>
      </div>
    </div>
  {/if}
</section>

<style>
  :global(body) {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    color: #333;
  }

  h1, h2 {
    color: #2c3e50;
    margin-bottom: 1rem;
  }

  .form-section, .filter-section, .data-section {
    margin-bottom: 2rem;
    background: #f9f9f9;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  form, .filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  input, select {
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    flex: 1 1 200px;
  }

  button {
    padding: 0.6rem 1.2rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  button:hover {
    background-color: #2980b9;
  }

  .danger {
    background-color: #e74c3c;
  }

  .danger:hover {
    background-color: #c0392b;
  }

  button.edit {
  padding: 0.6rem 1.2rem;
  background-color: #f39c12;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: background-color 0.2s;
  }

  button.edit:hover {
    background-color: #e67e22;
  }

  .success {
    padding: 0.8rem;
    background-color: #d4edda;
    color: #155724;
    border-left: 4px solid #28a745;
    margin: 1rem 0;
  }

  .error {
    padding: 0.8rem;
    background-color: #f8d7da;
    color: #721c24;
    border-left: 4px solid #dc3545;
    margin: 1rem 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th, td {
    padding: 0.8rem;
    border: 1px solid #ddd;
    text-align: center;
  }

  th {
    background-color: #f2f2f2;
    font-weight: 600;
  }

  tbody tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tbody tr:hover {
    background-color: #f1f1f1;
  }

  .pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
    font-size: 0.9rem;
  }

  .pagination-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .pagination-info {
    color: #555;
    font-size: 0.85rem;
  }

  .page-indicator {
    padding: 0.5rem 1rem;
    background: #f3f3f3;
    border-radius: 4px;
    margin: 0 0.5rem;
  }

  .pagination button {
    padding: 0.5rem 1rem;
    min-width: 80px;
  }

  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #ddd;
  }
</style>