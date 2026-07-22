// ==================== CONFIGURACIÓN ====================
const API_URL = 'http://127.0.0.1:5005';

// ==================== FETCH CON CREDENCIALES ====================
async function fetchWithCredentials(url, options = {}) {
    const defaultOptions = {
        credentials: 'include', // Envía cookies de sesión
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

// ==================== AUTENTICACIÓN Y EVENTOS ====================
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    
    // Login y Logout
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    
    // Modales (Cerrar)
    document.querySelectorAll('.close').forEach(close => {
        close.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Botones Abrir Modales
    const btnInsumo = document.getElementById('btn-nuevo-insumo');
    if (btnInsumo) btnInsumo.addEventListener('click', () => openModal('insumo'));
    
    const btnMovimiento = document.getElementById('btn-nuevo-movimiento');
    if (btnMovimiento) btnMovimiento.addEventListener('click', () => openModal('movimiento'));
    
    const btnCategoria = document.getElementById('btn-nueva-categoria');
    if (btnCategoria) btnCategoria.addEventListener('click', () => openModal('categoria'));
    
    const btnProveedor = document.getElementById('btn-nuevo-proveedor');
    if (btnProveedor) btnProveedor.addEventListener('click', () => alert('Función en desarrollo'));
    
    // Formularios Submit
    const insumoForm = document.getElementById('insumo-form');
    if (insumoForm) insumoForm.addEventListener('submit', handleInsumoSubmit);
    
    const movimientoForm = document.getElementById('movimiento-form');
    if (movimientoForm) movimientoForm.addEventListener('submit', handleMovimientoSubmit);
    
    const catForm = document.getElementById('categoria-form');
    if (catForm) catForm.addEventListener('submit', handleCategoriaSubmit);
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
            
            // Cargar datos principales
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
        
        const loginError = document.getElementById('login-error');
        if (loginError) loginError.textContent = '⚠️ Error de conexión con el servidor';
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
            await checkSession();
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
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.add('active');
    
    if (tabName === 'insumos') loadInsumos();
    if (tabName === 'movimientos') loadMovimientos();
    if (tabName === 'categorias') loadCategorias();
    if (tabName === 'proveedores') loadProveedores();
    if (tabName === 'reportes') loadReportes();
}

// ==================== MODALES ====================
function openModal(type, data = null) {
    if (type === 'insumo') {
        const modal = document.getElementById('modal-insumo');
        const form = document.getElementById('insumo-form');
        if (form) form.reset();
        
        document.getElementById('insumo-id').value = '';
        document.getElementById('modal-insumo-title').textContent = 'Nuevo Insumo';
        
        if (data) {
            document.getElementById('insumo-id').value = data.id_insumo;
            document.getElementById('insumo-codigo').value = data.codigo || '';
            document.getElementById('insumo-nombre').value = data.nombre || '';
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
        const form = document.getElementById('movimiento-form');
        if (form) form.reset();
        modal.style.display = 'flex';
        loadInsumosSelect();
    } else if (type === 'categoria') {
        const modal = document.getElementById('modal-categoria');
        const form = document.getElementById('categoria-form');
        if (form) form.reset();
        
        document.getElementById('categoria-id').value = '';
        document.getElementById('modal-categoria-title').textContent = 'Nueva Categoría';
        
        if (data) {
            document.getElementById('categoria-id').value = data.id_categoria;
            document.getElementById('categoria-nombre').value = data.nombre_categoria || '';
            document.getElementById('categoria-descripcion').value = data.descripcion || '';
            document.getElementById('modal-categoria-title').textContent = 'Editar Categoría';
        }
        
        modal.style.display = 'flex';
    }
}

// ==================== INSUMOS ====================
async function loadInsumos() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/insumos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const insumos = await response.json();
        
        const tbody = document.getElementById('insumos-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!Array.isArray(insumos)) return;
        
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
                    <button class="btn-action btn-edit" onclick="window.editInsumo(${insumo.id_insumo})">Editar</button>
                    <button class="btn-action btn-delete" onclick="window.deleteInsumo(${insumo.id_insumo})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading insumos:', error);
        const tbody = document.getElementById('insumos-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7">Error al cargar insumos</td></tr>';
    }
}

async function loadInsumosSelect() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/insumos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const insumos = await response.json();
        
        const select = document.getElementById('movimiento-insumo');
        if (!select) return;
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
            alert('Error: ' + (error.message || 'Error al guardar el insumo'));
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

// ==================== CATEGORÍAS ====================
async function loadCategorias() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/categorias`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const categorias = await response.json();
        
        // Renderizar tabla de Categorías
        const tbody = document.getElementById('categorias-body');
        if (tbody) {
            tbody.innerHTML = '';
            if (Array.isArray(categorias)) {
                categorias.forEach(cat => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${cat.id_categoria}</td>
                        <td>${cat.nombre_categoria}</td>
                        <td>${cat.descripcion || ''}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="window.editCategoria(${cat.id_categoria})">Editar</button>
                            <button class="btn-action btn-delete" onclick="window.deleteCategoria(${cat.id_categoria})">Eliminar</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

        // Renderizar selector en modal Insumos
        const select = document.getElementById('insumo-categoria');
        if (select) {
            select.innerHTML = '<option value="">Seleccionar categoría</option>';
            if (Array.isArray(categorias)) {
                categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id_categoria;
                    option.textContent = cat.nombre_categoria;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading categorias:', error);
        const tbody = document.getElementById('categorias-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4">Error al cargar categorías</td></tr>';
    }
}

async function handleCategoriaSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('categoria-id').value;
    const data = {
        nombre_categoria: document.getElementById('categoria-nombre').value,
        descripcion: document.getElementById('categoria-descripcion').value
    };
    
    try {
        const url = id ? `${API_URL}/categorias/${id}` : `${API_URL}/categorias`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetchWithCredentials(url, {
            method: method,
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('modal-categoria').style.display = 'none';
            loadCategorias();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'Error al guardar la categoría'));
        }
    } catch (error) {
        console.error('Error saving categoria:', error);
        alert('Error al guardar la categoría');
    }
}

async function editCategoria(id) {
    try {
        const response = await fetchWithCredentials(`${API_URL}/categorias/${id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        openModal('categoria', data);
    } catch (error) {
        console.error('Error loading categoria for edit:', error);
        alert('Error al cargar la categoría');
    }
}

async function deleteCategoria(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
        const response = await fetchWithCredentials(`${API_URL}/categorias/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadCategorias();
        } else {
            alert('Error al eliminar la categoría');
        }
    } catch (error) {
        console.error('Error deleting categoria:', error);
        alert('Error al eliminar la categoría');
    }
}

// ==================== MOVIMIENTOS ====================
async function loadMovimientos() {
    try {
        const response = await fetchWithCredentials(`${API_URL}/movimientos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const movimientos = await response.json();
        
        const tbody = document.getElementById('movimientos-body');
        if (!tbody) return;
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
        const tbody = document.getElementById('movimientos-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error al cargar movimientos</td></tr>';
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
        if (!tbody) return;
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
        const tbody = document.getElementById('proveedores-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error al cargar proveedores</td></tr>';
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
        if (stockList) {
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
        }
        
        // Resumen General
        const resumenResponse = await fetchWithCredentials(`${API_URL}/reportes/resumen`);
        if (!resumenResponse.ok) throw new Error(`HTTP ${resumenResponse.status}`);
        const resumen = await resumenResponse.json();
        
        const resumenDiv = document.getElementById('resumen-general');
        if (resumenDiv && resumen && !resumen.error) {
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
        const stockList = document.getElementById('stock-bajo-list');
        if (stockList) stockList.innerHTML = '<p>Error al cargar reportes</p>';
    }
}

// ==================== ASIGNACIONES GLOBALES ====================
window.editInsumo = editInsumo;
window.deleteInsumo = deleteInsumo;
window.editCategoria = editCategoria;
window.deleteCategoria = deleteCategoria;
