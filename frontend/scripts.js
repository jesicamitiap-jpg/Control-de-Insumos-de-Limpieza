// ==================== CONFIGURACIÓN ====================
const API_URL = 'https://control-de-insumos-de-limpieza.onrender.com';

// ==================== FETCH CON CREDENCIALES ====================
async function fetchWithCredentials(url, options = {}) {
    const defaultOptions = {
        credentials: 'include', // 🔥 ENVÍA COOKIES DE SESIÓN
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        return response;
    } catch (error) {
        console.error('❌ Error en fetch:', error);
        throw error;
    }
}

// ==================== AUTENTICACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    
    // Modales
    document.querySelectorAll('.close').forEach(close => {
        close.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Botones
    document.getElementById('btn-nuevo-insumo').addEventListener('click', () => openModal('insumo'));
    document.getElementById('btn-nuevo-movimiento').addEventListener('click', () => openModal('movimiento'));
    document.getElementById('btn-nueva-categoria').addEventListener('click', () => alert('Función en desarrollo'));
    document.getElementById('btn-nuevo-proveedor').addEventListener('click', () => alert('Función en desarrollo'));
    
    // Forms
    document.getElementById('insumo-form').addEventListener('submit', handleInsumoSubmit);
    document.getElementById('movimiento-form').addEventListener('submit', handleMovimientoSubmit);
});

// ==================== SESIÓN ====================
async function checkSession() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/check_session`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('main-container').style.display = 'block';
            document.getElementById('user-name').textContent = data.user.username;
            
            // Cargar datos
            loadInsumos();
            loadMovimientos();
            loadCategorias();
            loadProveedores();
            loadReportes();
        } else {
            document.getElementById('login-container').style.display = 'flex';
            document.getElementById('main-container').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking session:', error);
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('login-error').textContent = '⚠️ Error de conexión con el servidor';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetchWithCredentials(`${API_URL}/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('login-error').textContent = '';
            await checkSession(); // Recargar sesión
        } else {
            document.getElementById('login-error').textContent = data.message || 'Error de autenticación';
        }
    } catch (error) {
        document.getElementById('login-error').textContent = 'Error al conectar con el servidor';
        console.error('Login error:', error);
    }
}

async function handleLogout() {
    try {
        await fetchWithCredentials(`${API_URL}/logout`, { method: 'POST' });
        checkSession();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ==================== TABS ====================
function switchTab(e) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const tabName = e.target.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Recargar datos según tab
    if (tabName === 'insumos') loadInsumos();
    if (tabName === 'movimientos') loadMovimientos();
    if (tabName === 'reportes') loadReportes();
}

// ==================== INSUMOS ====================
async function loadInsumos() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/insumos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const insumos = await response.json();
        
        const tbody = document.getElementById('insumos-body');
        tbody.innerHTML = '';
        
        if (!Array.isArray(insumos)) {
            console.error('Error: insumos no es un array', insumos);
            return;
        }
        
        insumos.forEach(insumo => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${insumo.codigo}</td>
                <td>${insumo.nombre}</td>
                <td>${insumo.nombre_categoria || 'Sin categoría'}</td>
                <td>${insumo.stock_actual}</td>
                <td>${insumo.stock_minimo}</td>
                <td>$${insumo.precio_unitario || 0}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="editInsumo(${insumo.id_insumo})">Editar</button>
                    <button class="btn-action btn-delete" onclick="deleteInsumo(${insumo.id_insumo})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading insumos:', error);
        document.getElementById('insumos-body').innerHTML = '<tr><td colspan="7">Error al cargar insumos</td></tr>';
    }
}

async function loadCategorias() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/categorias`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const categorias = await response.json();
        
        const select = document.getElementById('insumo-categoria');
        select.innerHTML = '<option value="">Seleccionar categoría</option>';
        if (Array.isArray(categorias)) {
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id_categoria;
                option.textContent = cat.nombre_categoria;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categorias:', error);
    }
}

function openModal(type, data = null) {
    if (type === 'insumo') {
        const modal = document.getElementById('modal-insumo');
        const form = document.getElementById('insumo-form');
        form.reset();
        document.getElementById('insumo-id').value = '';
        document.getElementById('modal-insumo-title').textContent = 'Nuevo Insumo';
        
        if (data) {
            document.getElementById('insumo-id').value = data.id_insumo;
            document.getElementById('insumo-codigo').value = data.codigo;
            document.getElementById('insumo-nombre').value = data.nombre;
            document.getElementById('insumo-categoria').value = data.id_categoria || '';
            document.getElementById('insumo-unidad').value = data.unidad_medida || '';
            document.getElementById('insumo-stock-minimo').value = data.stock_minimo || 5;
            document.getElementById('insumo-stock-actual').value = data.stock_actual || 0;
            document.getElementById('insumo-precio').value = data.precio_unitario || 0;
            document.getElementById('insumo-descripcion').value = data.descripcion || '';
            document.getElementById('modal-insumo-title').textContent = 'Editar Insumo';
        }
        
        modal.style.display = 'flex';
        loadCategorias();
    } else if (type === 'movimiento') {
        const modal = document.getElementById('modal-movimiento');
        document.getElementById('movimiento-form').reset();
        modal.style.display = 'flex';
        loadInsumosSelect();
    }
}

async function loadInsumosSelect() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/insumos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const insumos = await response.json();
        const select = document.getElementById('movimiento-insumo');
        select.innerHTML = '';
        if (Array.isArray(insumos)) {
            insumos.forEach(insumo => {
                const option = document.createElement('option');
                option.value = insumo.id_insumo;
                option.textContent = `${insumo.codigo} - ${insumo.nombre} (Stock: ${insumo.stock_actual})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading insumos select:', error);
    }
}

async function handleInsumoSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('insumo-id').value;
    const data = {
        codigo: document.getElementById('insumo-codigo').value,
        nombre: document.getElementById('insumo-nombre').value,
        id_categoria: document.getElementById('insumo-categoria').value || null,
        unidad_medida: document.getElementById('insumo-unidad').value,
        stock_minimo: parseInt(document.getElementById('insumo-stock-minimo').value) || 5,
        stock_actual: parseInt(document.getElementById('insumo-stock-actual').value) || 0,
        precio_unitario: parseFloat(document.getElementById('insumo-precio').value) || 0,
        descripcion: document.getElementById('insumo-descripcion').value
    };
    
    try {
        const url = id ? `${API_URL}/insumos/${id}` : `${API_URL}/insumos`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetchWithCredentials(url, {
            method: method,
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('modal-insumo').style.display = 'none';
            loadInsumos();
            loadReportes();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'Error al guardar'));
        }
    } catch (error) {
        console.error('Error saving insumo:', error);
        alert('Error al guardar el insumo');
    }
}

async function editInsumo(id) {
    try {
        const response = await fetchWithCredentials(`${API_URL}/insumos/${id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        openModal('insumo', data);
    } catch (error) {
        console.error('Error loading insumo for edit:', error);
        alert('Error al cargar el insumo');
    }
}

async function deleteInsumo(id) {
    if (!confirm('¿Estás seguro de eliminar este insumo?')) return;
    
    try {
        const response = await fetchWithCredentials(`${API_URL}/insumos/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadInsumos();
            loadReportes();
        } else {
            alert('Error al eliminar el insumo');
        }
    } catch (error) {
        console.error('Error deleting insumo:', error);
        alert('Error al eliminar el insumo');
    }
}

// ==================== MOVIMIENTOS ====================
async function loadMovimientos() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/movimientos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const movimientos = await response.json();
        
        const tbody = document.getElementById('movimientos-body');
        tbody.innerHTML = '';
        
        if (Array.isArray(movimientos)) {
            movimientos.forEach(mov => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(mov.fecha_movimiento).toLocaleString()}</td>
                    <td>${mov.insumo_nombre || 'ID: ' + mov.id_insumo}</td>
                    <td><span class="badge ${mov.tipo_movimiento}">${mov.tipo_movimiento}</span></td>
                    <td>${mov.cantidad}</td>
                    <td>${mov.usuario_nombre || 'Sistema'}</td>
                    <td>${mov.observaciones || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading movimientos:', error);
        document.getElementById('movimientos-body').innerHTML = '<tr><td colspan="6">Error al cargar movimientos</td></tr>';
    }
}

async function handleMovimientoSubmit(e) {
    e.preventDefault();
    const data = {
        id_insumo: document.getElementById('movimiento-insumo').value,
        tipo_movimiento: document.getElementById('movimiento-tipo').value,
        cantidad: parseInt(document.getElementById('movimiento-cantidad').value),
        observaciones: document.getElementById('movimiento-observaciones').value
    };
    
    try {
        const response = await fetchWithCredentials(`${API_URL}/movimientos`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('modal-movimiento').style.display = 'none';
            loadMovimientos();
            loadInsumos();
            loadReportes();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'Error al registrar movimiento'));
        }
    } catch (error) {
        console.error('Error saving movimiento:', error);
        alert('Error al registrar el movimiento');
    }
}

// ==================== PROVEEDORES ====================
async function loadProveedores() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/proveedores`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const proveedores = await response.json();
        
        const tbody = document.getElementById('proveedores-body');
        tbody.innerHTML = '';
        
        if (Array.isArray(proveedores)) {
            proveedores.forEach(prov => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${prov.id_proveedor}</td>
                    <td>${prov.nombre_proveedor}</td>
                    <td>${prov.contacto || ''}</td>
                    <td>${prov.telefono || ''}</td>
                    <td>${prov.email || ''}</td>
                    <td>
                        <button class="btn-action btn-edit">Editar</button>
                        <button class="btn-action btn-delete">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading proveedores:', error);
        document.getElementById('proveedores-body').innerHTML = '<tr><td colspan="6">Error al cargar proveedores</td></tr>';
    }
}

// ==================== REPORTES ====================
async function loadReportes() {
    try {
        // Stock bajo
        const stockResponse = await fetchWithCredentials(`${API_URL}/reportes/stock_bajo`);
        if (!stockResponse.ok) throw new Error(`HTTP ${stockResponse.status}`);
        const stockBajo = await stockResponse.json();
        
        const stockList = document.getElementById('stock-bajo-list');
        stockList.innerHTML = '';
        
        if (Array.isArray(stockBajo) && stockBajo.length === 0) {
            stockList.innerHTML = '<p>✅ No hay productos con stock bajo</p>';
        } else if (Array.isArray(stockBajo)) {
            const ul = document.createElement('ul');
            stockBajo.forEach(item => {
                const li = document.createElement('li');
                li.className = 'stock-bajo-item';
                li.textContent = `${item.nombre}: ${item.stock_actual} unidades (Mínimo: ${item.stock_minimo})`;
                ul.appendChild(li);
            });
            stockList.appendChild(ul);
        }
        
        // Resumen
        const resumenResponse = await fetchWithCredentials(`${API_URL}/reportes/resumen`);
        if (!resumenResponse.ok) throw new Error(`HTTP ${resumenResponse.status}`);
        const resumen = await resumenResponse.json();
        
        const resumenDiv = document.getElementById('resumen-general');
        if (resumen && !resumen.error) {
            resumenDiv.innerHTML = `
                <div class="resumen-item">
                    <span class="label">Total de Insumos:</span>
                    <span class="value">${resumen.total_insumos || 0}</span>
                </div>
                <div class="resumen-item">
                    <span class="label">Stock Bajo:</span>
                    <span class="value">${resumen.stock_bajo || 0}</span>
                </div>
                <div class="resumen-item">
                    <span class="label">Movimientos Hoy:</span>
                    <span class="value">${resumen.movimientos_hoy || 0}</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading reportes:', error);
        document.getElementById('stock-bajo-list').innerHTML = '<p>Error al cargar reportes</p>';
    }
}

// ==================== UTILIDADES ====================
// Hacer funciones globales para los onclick
window.editInsumo = editInsumo;
window.deleteInsumo = deleteInsumo;