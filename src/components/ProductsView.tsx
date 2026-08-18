import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ScanBarcode,
  Sparkles,
  Layers,
  Tag,
  Ruler,
  History,
  X,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Github,
  GitBranch,
  Image as ImageIcon,
  Upload,
  Loader2,
  Settings,
  CheckCircle2,
  ImagePlus,
  FileUp
} from 'lucide-react';
import { Product, Category, Brand, Unit, StockMovement, ShopSettings } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { uploadFileToFirebaseStorage } from '../firebase';
import {
  formatGitHubImageURL,
  isGitHubImageURL,
  sampleGitHubRepoImages,
  GitHubUploadSettings,
  defaultGitHubUploadSettings,
  uploadImageToGitHubRepo
} from '../utils/githubImage';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  stockMovements: StockMovement[];
  settings: ShopSettings;
  tenantId?: string;
  onSaveProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (c: Category) => void;
  onDeleteCategory?: (id: string) => void;
  onAddBrand: (b: Brand) => void;
  onDeleteBrand?: (id: string) => void;
  onAddUnit: (u: Unit) => void;
  onDeleteUnit?: (id: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  brands,
  units,
  stockMovements,
  settings,
  tenantId,
  onSaveProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  onAddBrand,
  onDeleteBrand,
  onAddUnit,
  onDeleteUnit
}) => {
  const currency = settings.currencySymbol || '৳';

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands' | 'units'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedSubCat, setSelectedSubCat] = useState('ALL');

  // Modal State for Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  // Delete confirmation modal states
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  // History Drawer
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  // Sub-modal states
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string>(''); // empty for Main, or category id for Subcategory
  const [newBrandName, setNewBrandName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitShort, setNewUnitShort] = useState('');

  // GitHub Image Upload States
  const [uploadMode, setUploadMode] = useState<'firebase' | 'github'>('firebase');
  const [ghSettings, setGhSettings] = useState<GitHubUploadSettings>(() => {
    try {
      const saved = localStorage.getItem('github_upload_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.owner && parsed.repo) {
          return parsed;
        }
      }
      return defaultGitHubUploadSettings;
    } catch {
      return defaultGitHubUploadSettings;
    }
  });
  const [showGHConfig, setShowGHConfig] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const saveGHSettings = (newSet: GitHubUploadSettings) => {
    setGhSettings(newSet);
    localStorage.setItem('github_upload_settings', JSON.stringify(newSet));
  };

  const handleProcessImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadStatus({ type: 'error', msg: 'Please select a valid image file (PNG, JPG, WEBP, SVG).' });
      return;
    }

    if (uploadMode === 'firebase') {
      setIsUploading(true);
      setUploadStatus({ type: 'info', msg: `Uploading ${file.name} to Firebase Cloud Storage...` });

      const res = await uploadFileToFirebaseStorage(
        file, 
        `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        tenantId
      );
      setIsUploading(false);

      if (res.success && res.url) {
        setEditingProduct((prev) => ({ ...prev, image: res.url }));
        setUploadStatus({
          type: 'success',
          msg: 'Image permanently saved to Firebase Cloud Storage!'
        });
      } else {
        // Fallback to local Base64
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setEditingProduct((prev) => ({ ...prev, image: reader.result as string }));
            setUploadStatus({
              type: 'info',
              msg: 'Saved local image preview (Firebase Storage Note: ' + (res.error || 'Network') + ')'
            });
          }
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    // GitHub Upload Mode
    if (!ghSettings.token || !ghSettings.owner || !ghSettings.repo) {
      setShowGHConfig(true);
      setUploadStatus({
        type: 'info',
        msg: 'Please enter your GitHub Personal Access Token and Repo details below to upload directly to GitHub.'
      });
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && editingProduct) {
          setEditingProduct((prev) => ({ ...prev, image: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: 'info', msg: `Uploading ${file.name} to GitHub repository...` });

    const result = await uploadImageToGitHubRepo(file, ghSettings);
    setIsUploading(false);

    if (result.success && result.url) {
      setEditingProduct((prev) => ({ ...prev, image: result.url }));
      setUploadStatus({
        type: 'success',
        msg: `Successfully uploaded to GitHub repo! Direct URL set.`
      });
    } else {
      setUploadStatus({
        type: 'error',
        msg: result.error || 'Failed to upload to GitHub.'
      });
    }
  };

  const mainCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => !!c.parentId);

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCat === 'ALL' ||
      p.categoryId === selectedCat ||
      (selectedCat && categories.filter((sc) => sc.parentId === selectedCat).some((sc) => sc.id === p.categoryId));
    const matchesSubCat = selectedSubCat === 'ALL' || p.subCategoryId === selectedSubCat || p.categoryId === selectedSubCat;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q);
    return matchesCat && matchesSubCat && matchesQ;
  });

  const handleOpenNewModal = () => {
    const randomBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    const randomSKU = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    const defaultCat = mainCategories[0]?.id || categories[0]?.id || '';
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      sku: randomSKU,
      barcode: randomBarcode,
      categoryId: defaultCat,
      subCategoryId: '',
      brandId: brands[0]?.id || '',
      unitId: units[0]?.id || '',
      purchasePrice: 10,
      salePrice: 18,
      currentStock: 20,
      minStock: 5,
      description: '',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct({ ...p });
    setIsModalOpen(true);
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.sku || !editingProduct?.barcode) {
      alert('Product Title, SKU, and Barcode are required.');
      return;
    }
    const finalProduct: Product = {
      id: editingProduct.id || `prod-${Date.now()}`,
      name: editingProduct.name,
      sku: editingProduct.sku,
      barcode: editingProduct.barcode,
      categoryId: editingProduct.categoryId || categories[0]?.id || '',
      subCategoryId: editingProduct.subCategoryId || undefined,
      brandId: editingProduct.brandId || brands[0]?.id || '',
      unitId: editingProduct.unitId || units[0]?.id || '',
      purchasePrice: parseFloat(editingProduct.purchasePrice as any) || 0,
      salePrice: parseFloat(editingProduct.salePrice as any) || 0,
      currentStock: parseInt(editingProduct.currentStock as any) || 0,
      minStock: parseInt(editingProduct.minStock as any) || 0,
      image: editingProduct.image || '',
      description: editingProduct.description || '',
      status: 'active',
      createdAt: editingProduct.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    onSaveProduct(finalProduct);
    setIsModalOpen(false);
  };

  const handleGenerateAIDescription = () => {
    if (!editingProduct?.name) {
      alert('Please enter product name first.');
      return;
    }
    setEditingProduct((prev) => ({
      ...prev,
      description: `Premium quality ${editingProduct.name} crafted for durability and top-tier retail value. Includes warranty and sleek packaging.`
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Products Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'brands'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Brands ({brands.length})
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'units'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Units ({units.length})
          </button>
        </div>

        {activeTab === 'products' && (
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        )}
      </div>

      {/* PRODUCTS TAB CONTENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product name, SKU, or Barcode..."
                className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none"
              />
            </div>
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                setSelectedSubCat('ALL');
              }}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {mainCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {selectedCat !== 'ALL' && categories.filter((sc) => sc.parentId === selectedCat).length > 0 && (
              <select
                value={selectedSubCat}
                onChange={(e) => setSelectedSubCat(e.target.value)}
                className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none"
              >
                <option value="ALL">All Subcategories</option>
                {categories.filter((sc) => sc.parentId === selectedCat).map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    ↳ {sc.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Product Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">SKU / Barcode</th>
                    <th className="p-3.5">Category & Subcategory</th>
                    <th className="p-3.5 text-right">Cost Price</th>
                    <th className="p-3.5 text-right">Sale Price</th>
                    <th className="p-3.5 text-center">Stock Level</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredProducts.map((p) => {
                    const catName = categories.find((c) => c.id === p.categoryId)?.name || 'General';
                    const subCatName = p.subCategoryId ? categories.find((c) => c.id === p.subCategoryId)?.name : null;
                    const margin = p.salePrice > 0 ? (((p.salePrice - p.purchasePrice) / p.salePrice) * 100).toFixed(0) : '0';

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <div className="relative w-10 h-10 shrink-0">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80';
                                  }}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                                />
                                {isGitHubImageURL(p.image) && (
                                  <span
                                    title="Product Image hosted on GitHub Repository"
                                    className="absolute -bottom-1 -right-1 bg-slate-950 text-indigo-400 p-0.5 rounded-full border border-indigo-500/50 shadow"
                                  >
                                    <Github className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 font-bold flex items-center justify-center shrink-0 text-xs">
                                N/A
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                {p.name}
                                {isGitHubImageURL(p.image) && (
                                  <span className="text-[9px] bg-indigo-950/80 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-800/60 flex items-center gap-0.5">
                                    <Github className="w-2.5 h-2.5" /> GitHub
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-emerald-400 font-semibold">{margin}% Margin</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-300">
                          <div>SKU: {p.sku}</div>
                          <div className="text-slate-400">BC: {p.barcode}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-[10px] font-semibold">
                              {catName}
                            </span>
                            {subCatName && (
                              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-[9px] font-medium">
                                ↳ {subCatName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-medium text-slate-400">{currency}{p.purchasePrice.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-bold text-emerald-400">{currency}{p.salePrice.toFixed(2)}</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.currentStock <= 0
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : p.currentStock <= p.minStock
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {p.currentStock} Units
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedProductForHistory(p)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                              title="Stock History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Create Category / Subcategory
            </h3>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Parent Category (প্রধান ক্যাটাগরি)
              </label>
              <select
                value={newCatParentId}
                onChange={(e) => setNewCatParentId(e.target.value)}
                className="w-full bg-slate-950 text-xs text-slate-200 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
              >
                <option value="">None (Main Category / প্রধান ক্যাটাগরি)</option>
                {mainCategories.map((mc) => (
                  <option key={mc.id} value={mc.id}>
                    Under: {mc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {newCatParentId ? 'Subcategory Name (সাব-ক্যাটাগরির নাম)' : 'Category Name (ক্যাটাগরির নাম)'}
              </label>
              <input
                type="text"
                placeholder={newCatParentId ? 'e.g. Sports Shoes' : 'e.g. Footwear'}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-slate-950 text-xs text-slate-200 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                if (!newCatName.trim()) return;
                onAddCategory({
                  id: `cat-${Date.now()}`,
                  name: newCatName.trim(),
                  parentId: newCatParentId || undefined
                });
                setNewCatName('');
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              {newCatParentId ? 'Add Subcategory (সাব-ক্যাটাগরি যুক্ত করুন)' : 'Add Main Category (ক্যাটাগরি যুক্ত করুন)'}
            </button>
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Categories & Subcategories</h3>
            <div className="space-y-3">
              {mainCategories.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No categories created yet.
                </div>
              )}
              {mainCategories.map((c) => {
                const childSubCats = categories.filter((sc) => sc.parentId === c.id);
                const count = products.filter((p) => p.categoryId === c.id || p.subCategoryId === c.id).length;

                return (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{c.name}</span>
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded-md border border-indigo-800/50 font-mono">
                          {count} products
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setNewCatParentId(c.id);
                          }}
                          className="px-2 py-1 bg-slate-700/80 hover:bg-slate-700 text-indigo-300 rounded-lg text-[10px] font-semibold"
                        >
                          + Add Subcategory
                        </button>
                        {onDeleteCategory && (
                          <button
                            onClick={() => setDeletingCategory(c)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subcategories list */}
                    {childSubCats.length > 0 && (
                      <div className="pl-4 border-l-2 border-slate-700/60 pt-1 space-y-1.5">
                        {childSubCats.map((sc) => (
                          <div
                            key={sc.id}
                            className="flex justify-between items-center py-1 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300 font-medium">↳ {sc.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({products.filter((p) => p.subCategoryId === sc.id || p.categoryId === sc.id).length} items)
                              </span>
                            </div>
                            {onDeleteCategory && (
                              <button
                                onClick={() => setDeletingCategory(sc)}
                                className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                                title="Delete Subcategory"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BRANDS TAB */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" /> Create Brand
            </h3>
            <input
              type="text"
              placeholder="Brand Name (e.g. Nike)"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-200 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
            />
            <button
              onClick={() => {
                if (!newBrandName.trim()) return;
                onAddBrand({ id: `br-${Date.now()}`, name: newBrandName.trim() });
                setNewBrandName('');
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow"
            >
              Add Brand
            </button>
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Existing Brands</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {brands.map((b) => (
                <div key={b.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{b.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {products.filter((p) => p.brandId === b.id).length} products
                    </span>
                  </div>
                  {onDeleteBrand && (
                    <button
                      onClick={() => setDeletingBrand(b)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UNITS TAB */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-amber-400" /> Create Unit
            </h3>
            <input
              type="text"
              placeholder="Unit Name (e.g. Liters)"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-200 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Short Symbol (e.g. Ltr)"
              value={newUnitShort}
              onChange={(e) => setNewUnitShort(e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-200 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
            />
            <button
              onClick={() => {
                if (!newUnitName.trim()) return;
                onAddUnit({ id: `u-${Date.now()}`, name: newUnitName.trim(), shortName: newUnitShort || newUnitName });
                setNewUnitName('');
                setNewUnitShort('');
              }}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow"
            >
              Add Unit
            </button>
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Existing Units</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {units.map((u) => (
                <div key={u.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{u.name} ({u.shortName})</span>
                  {onDeleteUnit && (
                    <button
                      onClick={() => setDeletingUnit(u)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors"
                      title="Delete Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE PRODUCT MODAL */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Barcode *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Main Category</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: newCatId,
                        subCategoryId: ''
                      });
                    }}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    {mainCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Subcategory</label>
                  <select
                    value={editingProduct.subCategoryId || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subCategoryId: e.target.value || undefined })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    <option value="">None / General</option>
                    {categories
                      .filter((sc) => sc.parentId === editingProduct.categoryId)
                      .map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Brand</label>
                  <select
                    value={editingProduct.brandId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brandId: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Unit</label>
                  <select
                    value={editingProduct.unitId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unitId: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Cost Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.purchasePrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Sale Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.salePrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 text-emerald-400 p-2.5 rounded-xl border border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Initial Stock Level</label>
                  <input
                    type="number"
                    value={editingProduct.currentStock || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Minimum Alert Level</label>
                  <input
                    type="number"
                    value={editingProduct.minStock || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 text-amber-400 p-2.5 rounded-xl border border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold text-xs flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    Product Image & Cloud Storage Uploader
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setUploadMode('firebase')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                          uploadMode === 'firebase'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ☁️ Firebase Storage
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('github')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                          uploadMode === 'github'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🐙 GitHub Repo
                      </button>
                    </div>

                    {uploadMode === 'github' && (
                      <button
                        type="button"
                        onClick={() => setShowGHConfig(!showGHConfig)}
                        className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <Settings className="w-3 h-3 text-indigo-400" />
                        {showGHConfig ? 'Hide Config' : 'Repo Config'}
                      </button>
                    )}
                  </div>
                </div>

                {/* GitHub Config Drawer */}
                {uploadMode === 'github' && showGHConfig && (
                  <div className="bg-slate-900 border border-indigo-900/60 p-3 rounded-xl space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5" /> GitHub Repository Upload Credentials
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">GitHub Owner / Username *</label>
                        <input
                          type="text"
                          value={ghSettings.owner}
                          onChange={(e) => saveGHSettings({ ...ghSettings, owner: e.target.value })}
                          placeholder="e.g. oliurtech"
                          className="w-full bg-slate-950 text-slate-200 p-1.5 rounded-lg border border-slate-800 text-[11px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">Repository Name *</label>
                        <input
                          type="text"
                          value={ghSettings.repo}
                          onChange={(e) => saveGHSettings({ ...ghSettings, repo: e.target.value })}
                          placeholder="e.g. store-product-images"
                          className="w-full bg-slate-950 text-slate-200 p-1.5 rounded-lg border border-slate-800 text-[11px] font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">Personal Access Token (PAT) *</label>
                        <input
                          type="password"
                          value={ghSettings.token}
                          onChange={(e) => saveGHSettings({ ...ghSettings, token: e.target.value })}
                          placeholder="ghp_... or github_pat_..."
                          className="w-full bg-slate-950 text-slate-200 p-1.5 rounded-lg border border-slate-800 text-[11px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">Branch & Folder</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={ghSettings.branch}
                            onChange={(e) => saveGHSettings({ ...ghSettings, branch: e.target.value })}
                            placeholder="main"
                            className="w-1/2 bg-slate-950 text-slate-200 p-1.5 rounded-lg border border-slate-800 text-[11px] font-mono"
                          />
                          <input
                            type="text"
                            value={ghSettings.folderPath}
                            onChange={(e) => saveGHSettings({ ...ghSettings, folderPath: e.target.value })}
                            placeholder="products"
                            className="w-1/2 bg-slate-950 text-slate-200 p-1.5 rounded-lg border border-slate-800 text-[11px] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      💡 <strong>Create PAT:</strong> GitHub → Settings → Developer Settings → Personal Access Tokens → Generate token with <code className="text-indigo-300 font-mono">repo</code> / <code className="text-indigo-300 font-mono">Contents: Read & Write</code> permissions.
                    </p>
                  </div>
                )}

                {/* Drag and Drop Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProcessImageUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    isDragging
                      ? 'border-amber-500 bg-amber-950/40'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <input
                    type="file"
                    id="product-image-file-input"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessImageUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                      <div className="text-xs text-amber-300 font-bold">
                        {uploadMode === 'firebase' ? 'Uploading to Firebase Cloud Storage...' : 'Uploading to GitHub Repository...'}
                      </div>
                      <p className="text-[10px] text-slate-400">Saving permanent media asset...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1.5 cursor-pointer" onClick={() => document.getElementById('product-image-file-input')?.click()}>
                      <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-slate-200 font-bold">
                        <span className="text-amber-400 hover:underline">Click to upload</span> or drag and drop image here
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {uploadMode === 'firebase'
                          ? 'Instant permanent upload to Firebase Cloud Storage (one-studio-apps.firebasestorage.app)'
                          : (ghSettings.token && ghSettings.owner && ghSettings.repo
                              ? `Will upload directly to GitHub Repo (${ghSettings.owner}/${ghSettings.repo})`
                              : 'Configure GitHub repo to auto-upload to GitHub CDN')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Status Banner */}
                {uploadStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${
                      uploadStatus.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                        : uploadStatus.type === 'error'
                        ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                        : 'bg-indigo-950/80 border border-indigo-800 text-indigo-300'
                    }`}
                  >
                    <span>{uploadStatus.msg}</span>
                    <button
                      type="button"
                      onClick={() => setUploadStatus(null)}
                      className="text-slate-400 hover:text-white text-xs font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">
                    Or paste GitHub Image URL / Direct Image Web Link:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.image || ''}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      const formatted = formatGitHubImageURL(rawVal);
                      setEditingProduct({ ...editingProduct, image: formatted });
                    }}
                    placeholder="e.g. https://github.com/owner/repo/blob/main/image.png or raw URL"
                    className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <p className="text-[10px] text-slate-400">
                  <strong className="text-indigo-300">GitHub Link Auto-Format:</strong> Pasting GitHub web links (e.g. <code className="text-slate-300">github.com/user/repo/blob/...</code> or shorthand <code className="text-slate-300">user/repo/main/img.jpg</code>) automatically converts to direct raw GitHub image content.
                </p>

                {/* Sample GitHub Repo Images Quick Picker */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">
                    Pick Sample GitHub Repository Image:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {sampleGitHubRepoImages.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, image: s.url })}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Github className="w-3 h-3 text-indigo-400" /> {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Image Preview */}
                {editingProduct.image && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                    <img
                      src={editingProduct.image}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80';
                      }}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="text-[11px] text-slate-400 overflow-hidden">
                      <div className="font-bold text-slate-200">Image Preview</div>
                      <div className="text-[10px] font-mono text-indigo-400 truncate max-w-xs">{editingProduct.image}</div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-bold">Product Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    className="text-emerald-400 text-[10px] font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto AI Description
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK HISTORY DRAWER */}
      {selectedProductForHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Stock Movement History</h3>
              <button onClick={() => setSelectedProductForHistory(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <img src={selectedProductForHistory.image} alt={selectedProductForHistory.name} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <div className="font-bold text-xs text-slate-200">{selectedProductForHistory.name}</div>
                <div className="text-[10px] text-emerald-400 font-bold">Current Stock: {selectedProductForHistory.currentStock} Units</div>
              </div>
            </div>

            <div className="space-y-2">
              {stockMovements
                .filter((sm) => sm.productId === selectedProductForHistory.id)
                .map((sm) => (
                  <div key={sm.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-200">{sm.referenceNo}</div>
                      <div className="text-[10px] text-slate-400">{sm.date} | {sm.note}</div>
                    </div>
                    <span className={`font-black text-xs ${sm.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sm.type === 'IN' ? `+${sm.quantity}` : `-${sm.quantity}`}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE PRODUCT CONFIRMATION DIALOG MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">প্রডাক্ট ডিলিট নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-400">Product Delete Confirmation</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>
                আপনি কি নিশ্চিত যে আপনি <span className="font-bold text-rose-400">"{deletingProduct.name}"</span> প্রডাক্টটি ডিলিট করতে চান?
              </div>
              <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                SKU: {deletingProduct.sku} | Barcode: {deletingProduct.barcode}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                না, রাখুন (No)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(deletingProduct.id);
                  setDeletingProduct(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> হ্যাঁ, ডিলিট করুন (Yes)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CATEGORY CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title="ক্যাটাগরি ডিলিট নিশ্চিতকরণ"
        description="আপনি কি নিশ্চিত যে এই ক্যাটাগরি ডিলিট করতে চান?"
        itemName={deletingCategory?.name}
        onConfirm={() => {
          if (deletingCategory && onDeleteCategory) {
            onDeleteCategory(deletingCategory.id);
          }
          setDeletingCategory(null);
        }}
        onCancel={() => setDeletingCategory(null)}
      />

      {/* DELETE BRAND CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingBrand}
        title="ব্র্যান্ড ডিলিট নিশ্চিতকরণ"
        description="আপনি কি নিশ্চিত যে এই ব্র্যান্ড ডিলিট করতে চান?"
        itemName={deletingBrand?.name}
        onConfirm={() => {
          if (deletingBrand && onDeleteBrand) {
            onDeleteBrand(deletingBrand.id);
          }
          setDeletingBrand(null);
        }}
        onCancel={() => setDeletingBrand(null)}
      />

      {/* DELETE UNIT CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingUnit}
        title="ইউনিট ডিলিট নিশ্চিতকরণ"
        description="আপনি কি নিশ্চিত যে এই ইউনিট ডিলিট করতে চান?"
        itemName={deletingUnit ? `${deletingUnit.name} (${deletingUnit.shortName})` : ''}
        onConfirm={() => {
          if (deletingUnit && onDeleteUnit) {
            onDeleteUnit(deletingUnit.id);
          }
          setDeletingUnit(null);
        }}
        onCancel={() => setDeletingUnit(null)}
      />
    </div>
  );
};
