import { useState, useEffect } from 'react';
import AppShell from '../components/common/AppShell.jsx';
import Toast from '../components/common/Toast.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

export default function ManageFields() {
  const { user } = useAuth();
  const { config, reload } = useConfig();
  const { put } = useApi();
  
  const [activeTab, setActiveTab] = useState('product'); // 'product' or 'sale'
  const [productFields, setProductFields] = useState([]);
  const [saleFields, setSaleFields] = useState([]);
  
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State for new field
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState('text');
  const [newOption, setNewOption] = useState('');
  const [newOptionsList, setNewOptionsList] = useState([]);

  // Auto-generate key name from label
  useEffect(() => {
    const key = newLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '') // remove special characters
      .replace(/\s+(.)/g, (match, group) => group.toUpperCase()) // camelCase
      .replace(/\s+/g, ''); // strip spaces
    setNewKey(key);
  }, [newLabel]);

  // Load configured fields on config change
  useEffect(() => {
    if (config) {
      setProductFields(config.custom_metadata_fields || []);
      setSaleFields(config.custom_sale_fields || []);
    }
  }, [config]);

  if (!['SUPER_ADMIN', 'ADMIN'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAddOption = (e) => {
    e.preventDefault();
    const val = newOption.trim();
    if (!val) return;
    if (newOptionsList.includes(val)) {
      setToast('Option already exists');
      return;
    }
    setNewOptionsList([...newOptionsList, val]);
    setNewOption('');
  };

  const handleRemoveOption = (index) => {
    setNewOptionsList(newOptionsList.filter((_, i) => i !== index));
  };

  const handleAddField = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      setToast('Field Label is required');
      return;
    }
    if (!newKey.trim()) {
      setToast('Field Key name is required');
      return;
    }

    const newField = {
      key: newKey.trim(),
      label: newLabel.trim(),
      type: newType,
      ...(newType === 'select' || newType === 'multiselect' ? { options: newOptionsList } : {}),
    };

    // Check duplicate keys
    const currentFields = activeTab === 'product' ? productFields : saleFields;
    if (currentFields.some((f) => f.key === newField.key)) {
      setToast(`Field key "${newField.key}" already exists`);
      return;
    }

    if (activeTab === 'product') {
      setProductFields([...productFields, newField]);
    } else {
      setSaleFields([...saleFields, newField]);
    }

    // Reset Form
    setNewLabel('');
    setNewKey('');
    setNewType('text');
    setNewOption('');
    setNewOptionsList([]);
    setToast('Field added to draft. Remember to save changes.');
  };

  const handleRemoveField = (keyToRemove) => {
    if (activeTab === 'product') {
      setProductFields(productFields.filter((f) => f.key !== keyToRemove));
    } else {
      setSaleFields(saleFields.filter((f) => f.key !== keyToRemove));
    }
    setToast('Field removed from draft. Remember to save changes.');
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    setToast('');
    try {
      const configKey = activeTab === 'product' ? 'custom_metadata_fields' : 'custom_sale_fields';
      const fieldsList = activeTab === 'product' ? productFields : saleFields;
      
      await put('/api/config', {
        key: configKey,
        value: JSON.stringify(fieldsList),
      });
      await reload();
      setToast('Fields configuration saved successfully');
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentFieldsList = activeTab === 'product' ? productFields : saleFields;

  return (
    <AppShell>
      <Toast
        message={toast}
        type={
          toast.includes('successfully') || toast.includes('added') || toast.includes('removed')
            ? 'success'
            : toast.toLowerCase().includes('required') ||
              toast.toLowerCase().includes('exists') ||
              toast.toLowerCase().includes('already') ||
              toast.toLowerCase().includes('fail') ||
              toast.toLowerCase().includes('invalid') ||
              toast.toLowerCase().includes('error')
            ? 'error'
            : 'info'
        }
        onClose={() => setToast('')}
      />

      <div className="max-w-6xl mx-auto space-y-6 text-left">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-background font-headline tracking-tight">Custom Fields Builder</h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Add dynamically managed input attributes to your Products or checkout Customer sales forms.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {loading ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-outline-variant">
          <button
            type="button"
            onClick={() => {
              setActiveTab('product');
              setNewLabel('');
              setNewOptionsList([]);
            }}
            className={`pb-3 text-xs font-semibold px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'product'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Product Inventory Fields
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('sale');
              setNewLabel('');
              setNewOptionsList([]);
            }}
            className={`pb-3 text-xs font-semibold px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'sale'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            Sales & Customer Checkout Fields
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Active Fields List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="font-headline font-bold text-sm text-on-surface pb-2 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
                Active Fields ({currentFieldsList.length})
              </h2>

              {currentFieldsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl opacity-35 block mb-2">display_settings</span>
                  No custom fields configured for this section. Add one from the builder panel.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentFieldsList.map((field) => (
                    <div
                      key={field.key}
                      className="p-4 border border-outline-variant rounded-xl bg-surface-container-low flex flex-col justify-between relative group hover:border-outline transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-xs font-bold text-on-surface">{field.label}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{field.key}</p>
                          </div>
                          
                          {/* Type Pill */}
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            field.type === 'text' ? 'bg-[#e8f5e9] text-[#2e7d32]' :
                            field.type === 'textarea' ? 'bg-[#f5f5f5] text-[#616161]' :
                            field.type === 'number' ? 'bg-[#e3f2fd] text-[#1565c0]' :
                            field.type === 'toggle' ? 'bg-[#f3e5f5] text-[#6a1b9a]' :
                            field.type === 'select' ? 'bg-[#fff8e1] text-[#f57f17]' :
                            field.type === 'multiselect' ? 'bg-[#e0f2f1] text-[#00695c]' :
                            field.type === 'date' ? 'bg-[#e0f7fa] text-[#00838f]' :
                            'bg-[#efebe9] text-[#4e342e]'
                          }`}>
                            {field.type}
                          </span>
                        </div>

                        {(field.type === 'select' || field.type === 'multiselect') && field.options && (
                          <div className="pt-1.5 space-y-1">
                            <p className="text-[9px] font-bold text-on-surface-variant">Dropdown Options:</p>
                            <div className="flex flex-wrap gap-1">
                              {field.options.map((opt) => (
                                <span key={opt} className="text-[8px] bg-surface-container-high border border-outline-variant/30 text-on-surface-variant px-1.5 py-0.5 rounded-full">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-3 mt-3 border-t border-outline-variant/20">
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.key)}
                          className="flex items-center gap-0.5 text-xs text-error font-semibold hover:underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Field Panel */}
          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="font-headline font-bold text-sm text-on-surface pb-2 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">add_box</span>
                Add Custom Field
              </h2>

              <form onSubmit={handleAddField} className="space-y-4">
                {/* Field Label */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-on-surface-variant">Field Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer GSTIN"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                  />
                </div>

                {/* Field Key */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-on-surface-variant">Field Key Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. customerGstin"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="h-10 w-full px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs font-mono"
                  />
                  <span className="block text-[9px] text-on-surface-variant/70 leading-normal">
                    Unique identifier slug used inside SQL records.
                  </span>
                </div>

                {/* Field Type */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-on-surface-variant">Input Field Type *</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      setNewType(e.target.value);
                      setNewOptionsList([]);
                    }}
                    className="h-10 w-full px-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs"
                  >
                    <option value="text">Text Box (Single-line)</option>
                    <option value="textarea">Multi-line Text Box</option>
                    <option value="number">Numeric Box</option>
                    <option value="toggle">Toggle / Switch</option>
                    <option value="select">Dropdown Select (Single)</option>
                    <option value="multiselect">Dropdown Select (Multiple)</option>
                    <option value="date">Date Picker</option>
                    <option value="file">File / Attachment (Image or PDF)</option>
                  </select>
                </div>

                {/* Select Options Builder */}
                {(newType === 'select' || newType === 'multiselect') && (
                  <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                    <label className="block text-[11px] font-semibold text-on-surface-variant">Dropdown Options *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Option A"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        className="h-9 flex-1 px-3 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="h-9 px-3 bg-secondary-container text-on-primary-container text-xs font-bold rounded-lg hover:opacity-90 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Display badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {newOptionsList.length === 0 ? (
                        <p className="text-[10px] italic text-on-surface-variant">No options added yet.</p>
                      ) : (
                        newOptionsList.map((opt, idx) => (
                          <span
                            key={opt}
                            className="inline-flex items-center gap-1 text-[9px] bg-surface-container-high border border-outline-variant/30 text-on-surface-variant pl-2 pr-1 py-0.5 rounded-full"
                          >
                            {opt}
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-outline-variant/30 text-on-surface-variant/70"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Field */}
                <button
                  type="submit"
                  className="w-full h-10 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:opacity-90 shadow-sm flex items-center justify-center gap-1.5 mt-4 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Dynamic Field
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
