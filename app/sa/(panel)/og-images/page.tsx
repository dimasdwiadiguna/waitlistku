"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface OgImage {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

export default function SaOgImagesPage() {
  const router = useRouter();
  const [images, setImages] = useState<OgImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    setLoading(true);
    const res = await fetch("/api/sa/og-images");
    if (res.status === 401) { router.push("/sa/login"); return; }
    if (res.ok) setImages(await res.json());
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) { toast.error("Nama dan file wajib diisi"); return; }
    setUploading(true);
    const form = new FormData();
    form.append("file", uploadFile);
    form.append("name", uploadName.trim());
    const res = await fetch("/api/sa/og-images", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) {
      toast.success("Gambar berhasil diupload");
      setShowUpload(false);
      setUploadName("");
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
      fetchImages();
    } else {
      const data = await res.json();
      toast.error(data.error || "Gagal mengupload gambar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus gambar ini? Sesi yang menggunakannya akan kehilangan thumbnail.")) return;
    const res = await fetch(`/api/sa/og-images/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Gambar dihapus"); fetchImages(); }
    else toast.error("Gagal menghapus");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#E2E8F0", margin: 0 }}>🖼️ OG Images</h1>
          <p style={{ color: "#718096", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Gambar-gambar ini bisa dipilih pemilik sesi sebagai thumbnail link preview.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            background: "#6C63FF",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.625rem 1.25rem",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          + Upload Gambar
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem",
        }}>
          <div style={{ background: "#1E2235", borderRadius: "1rem", width: "100%", maxWidth: "28rem", padding: "1.5rem" }}>
            <h2 style={{ color: "#E2E8F0", fontWeight: 700, fontSize: "1.125rem", marginBottom: "1.25rem" }}>Upload Gambar OG</h2>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ color: "#A0AEC0", fontSize: "0.8125rem", display: "block", marginBottom: "0.375rem" }}>Nama Gambar</label>
              <input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="contoh: Banner Ramadan 2025"
                style={{
                  width: "100%", background: "#13162B", border: "1px solid #2D3148",
                  borderRadius: "0.5rem", padding: "0.5rem 0.75rem", color: "#E2E8F0",
                  fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ color: "#A0AEC0", fontSize: "0.8125rem", display: "block", marginBottom: "0.375rem" }}>
                File (JPG/PNG/WebP, max 2MB)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                style={{ color: "#A0AEC0", fontSize: "0.875rem" }}
              />
              {uploadFile && (
                <p style={{ color: "#68D391", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => { setShowUpload(false); setUploadName(""); setUploadFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                style={{ flex: 1, background: "none", border: "1px solid #2D3148", borderRadius: "0.5rem", color: "#718096", padding: "0.5rem", cursor: "pointer", fontWeight: 500 }}
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  flex: 1, background: uploading ? "#4a43bb" : "#6C63FF", border: "none",
                  borderRadius: "0.5rem", color: "white", padding: "0.5rem", cursor: uploading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {uploading ? "Mengupload..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ aspectRatio: "16/9", background: "#1E2235", borderRadius: "0.75rem", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🖼️</div>
          <p>Belum ada gambar. Upload gambar pertamamu!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                background: "#1E2235", borderRadius: "0.75rem",
                border: "1px solid #2D3148", overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name}
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "0.75rem" }}>
                <p style={{ color: "#E2E8F0", fontSize: "0.875rem", fontWeight: 600, margin: 0, marginBottom: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {img.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#6C63FF", fontSize: "0.75rem", textDecoration: "none" }}
                  >
                    ↗ Lihat
                  </a>
                  <button
                    onClick={() => handleDelete(img.id)}
                    style={{ background: "none", border: "none", color: "#FC8181", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
