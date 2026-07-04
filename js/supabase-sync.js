/* ============================================================
   AgroPOS – Lớp đồng bộ Supabase (cloud sync)
   ------------------------------------------------------------
   - Nếu CHƯA điền key Supabase: app chạy y như cũ (localStorage),
     dữ liệu chỉ nằm trên 1 máy. Localhost vẫn chạy bình thường.
   - Nếu ĐÃ điền key: dữ liệu đồng bộ lên cloud, khách trên điện
     thoại và admin trên máy tính thấy chung 1 dữ liệu.

   Cách hoạt động: lưu mỗi "bảng" (products, customers, invoices,
   custOrders, stockImports, settings) thành 1 dòng JSON trong
   bảng app_data của Supabase. Đơn giản, không phải sửa lại
   toàn bộ hàm trong app.
   ============================================================ */

// 👉 ĐIỀN 2 GIÁ TRỊ NÀY SAU KHI TẠO PROJECT SUPABASE
// (Lấy ở: Supabase Dashboard → Project Settings → API)
const SUPABASE_URL = 'https://yzmdxyxdzksleslwiyjg.supabase.co';       // VD: https://abcdxyz.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bWR4eXhkemtzbGVzbHdpeWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMjc4NjIsImV4cCI6MjA5ODcwMzg2Mn0.JFVxV4Ti1EbNZT-uWxRDDbcQ_RdX3w2LxEZ8rVTjMxU';  // VD: eyJhbGciOi... (anon public key)

// Các bảng dữ liệu cần đồng bộ (khớp với object DB trong app)
const SYNC_TABLES = ['products', 'customers', 'invoices', 'stockImports', 'custOrders', 'settings'];

let _sb = null;            // Supabase client
let _cloudReady = false;   // Đã kết nối cloud chưa
let _pushTimer = null;     // debounce khi lưu

// Có cấu hình cloud hay không
function cloudEnabled() {
  return SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase;
}

// Khởi tạo client
function initCloud() {
  if (!cloudEnabled()) {
    console.log('[AgroPOS] Chạy chế độ offline (localStorage). Điền key Supabase trong js/supabase-sync.js để bật cloud.');
    return false;
  }
  try {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    _cloudReady = true;
    console.log('[AgroPOS] ✅ Đã kết nối Supabase cloud');
    return true;
  } catch (e) {
    console.error('[AgroPOS] Lỗi kết nối Supabase:', e);
    return false;
  }
}

// Tải toàn bộ dữ liệu từ cloud về, gộp vào DB rồi vẽ lại
async function pullFromCloud() {
  if (!_cloudReady) return false;
  try {
    const { data, error } = await _sb.from('app_data').select('key, value');
    if (error) throw error;
    if (data && data.length) {
      data.forEach(row => {
        if (SYNC_TABLES.includes(row.key) && row.value != null) {
          DB[row.key] = row.value;   // DB là biến toàn cục trong app
        }
      });
      // Lưu cache localStorage để lần sau mở nhanh
      localStorage.setItem('agropos_v2', JSON.stringify(DB));
      console.log('[AgroPOS] ⬇️ Đã tải dữ liệu từ cloud');
    } else {
      // Cloud trống → đẩy dữ liệu hiện tại lên lần đầu
      await pushToCloud(true);
      console.log('[AgroPOS] ⬆️ Cloud trống, đã khởi tạo dữ liệu ban đầu');
    }
    return true;
  } catch (e) {
    console.error('[AgroPOS] Lỗi tải cloud:', e);
    return false;
  }
}

// Đẩy toàn bộ DB lên cloud (debounce để tránh gọi quá nhiều)
async function pushToCloud(immediate = false) {
  if (!_cloudReady) return;
  const doPush = async () => {
    try {
      const rows = SYNC_TABLES.map(key => ({ key, value: DB[key] ?? null }));
      const { error } = await _sb.from('app_data').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      console.log('[AgroPOS] ⬆️ Đã đồng bộ lên cloud');
    } catch (e) {
      console.error('[AgroPOS] Lỗi đồng bộ:', e);
    }
  };
  if (immediate) { await doPush(); return; }
  clearTimeout(_pushTimer);
  _pushTimer = setTimeout(doPush, 800); // gộp các lần lưu trong 0.8s
}

// ── Gắn vào vòng đời app ──
// Bọc hàm saveDB() gốc: vẫn lưu localStorage + đẩy lên cloud
function hookSaveDB() {
  if (typeof window.saveDB !== 'function') return;
  const original = window.saveDB;
  window.saveDB = function () {
    original();          // lưu localStorage như cũ
    pushToCloud();       // đồng bộ cloud (nếu bật)
  };
}

// Chạy khi trang tải xong
window.addEventListener('load', async () => {
  hookSaveDB();
  if (initCloud()) {
    await pullFromCloud();
    // Nếu đang ở màn admin/khách thì vẽ lại cho cập nhật
    if (typeof adminPage !== 'undefined' && document.getElementById('screen-admin') &&
        !document.getElementById('screen-admin').classList.contains('hidden')) {
      showAdminPage(adminPage);
    }
  }
});
