import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Printer, Mail } from 'lucide-react';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { usePartnerStore } from '../../store/usePartnerStore';
import { useProductStore } from '../../store/useProductStore';
import { generateInvoiceEmailLink } from '../../utils/email';
import { downloadInvoicePDF } from '../../utils/pdf';
import type { Invoice, InvoiceItem } from '../../types';

export function InvoiceForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { addInvoice, updateInvoice, getInvoice } = useInvoiceStore();
    const { clients } = usePartnerStore();
    const { products } = useProductStore();

    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState<Partial<Invoice>>({
        number: `INV-${Date.now()}`, // Simple auto-gen
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clientId: '',
        type: 'RETAIL',
        items: [],
        status: 'UNPAID',
        currency: 'DZD',
    });

    useEffect(() => {
        if (isEditMode && id) {
            const invoice = getInvoice(id);
            if (invoice) {
                setFormData(invoice);
            }
        }
    }, [isEditMode, id, getInvoice]);

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const client = clients.find(c => c.id === e.target.value);
        setFormData(prev => ({
            ...prev,
            clientId: e.target.value,
            clientName: client?.name || '',
        }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...(prev.items || []),
                {
                    id: crypto.randomUUID(),
                    productId: '',
                    productName: '',
                    quantity: 1,
                    unitPrice: 0,
                    tax: 0,
                    discount: 0,
                    total: 0,
                }
            ]
        }));
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        setFormData(prev => {
            const newItems = [...(prev.items || [])];
            const item = { ...newItems[index], [field]: value };

            // If product changed, update related fields
            if (field === 'productId') {
                const product = products.find(p => p.id === value);
                if (product) {
                    item.productName = product.name;
                    item.unitPrice = prev.type === 'EXPORT' ? (product.sellPriceExport || product.sellPrice) : product.sellPrice;
                    item.tax = product.tax || 0;
                }
            }

            // Recalculate total
            const subtotal = item.quantity * item.unitPrice;
            const taxAmount = subtotal * (item.tax / 100);
            item.total = subtotal + taxAmount - item.discount;

            newItems[index] = item;
            return { ...prev, items: newItems };
        });
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: (prev.items || []).filter((_, i) => i !== index),
        }));
    };

    // Calculate totals
    const totalHT = (formData.items || []).reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const totalTax = (formData.items || []).reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.tax / 100)), 0);
    const totalTTC = (formData.items || []).reduce((acc, item) => acc + item.total, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const invoiceData = {
            ...formData,
            totalHT,
            totalTax,
            totalTTC,
        } as Invoice;

        if (isEditMode && id) {
            updateInvoice(id, invoiceData);
        } else {
            addInvoice({
                ...invoiceData,
                id: crypto.randomUUID(),
            });
        }

        navigate('/sales');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/sales')}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isEditMode ? 'Modifier la Facture' : 'Nouvelle Facture'}
                        </h1>
                        <p className="text-slate-500">Création d'une facture de vente</p>
                    </div>
                </div>
                {isEditMode && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={async () => {
                                if (id) {
                                    const invoice = getInvoice(id);
                                    const client = clients.find(c => c.id === invoice?.clientId);
                                    if (invoice) {
                                        const success = await downloadInvoicePDF(invoice, client);
                                        if (success) {
                                            window.location.href = generateInvoiceEmailLink(invoice, client);
                                            setTimeout(() => {
                                                alert("La facture PDF a été téléchargée.\n\nN'oubliez pas de l'ajouter en pièce jointe dans votre email !");
                                            }, 1000);
                                        }
                                    }
                                }
                            }}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                            title="Envoyer par email (avec PDF)"
                        >
                            <Mail size={20} />
                            <span className="hidden sm:inline">Email</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => window.open(`/sales/${id}/print`, '_blank')}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                            title="Imprimer la facture"
                        >
                            <Printer size={20} />
                            <span className="hidden sm:inline">Imprimer</span>
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Type de Facture</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="RETAIL">Vente Détail</option>
                            <option value="EXPORT">Exportation</option>
                            <option value="PROFORMA">Proforma</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Client</label>
                        <select
                            required
                            value={formData.clientId}
                            onChange={handleClientChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Sélectionner un client</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Date</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Date d'échéance</label>
                        <input
                            type="date"
                            value={formData.dueDate || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {formData.type === 'EXPORT' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Devise</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="DZD">DZD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Pays de destination</label>
                                <input
                                    type="text"
                                    value={formData.destinationCountry || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, destinationCountry: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Port de livraison</label>
                                <input
                                    type="text"
                                    value={formData.deliveryPort || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryPort: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Lignes de produits</h2>
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                        >
                            <Plus size={16} />
                            Ajouter un produit
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-medium">
                                <tr>
                                    <th className="px-4 py-3 w-1/3">Produit</th>
                                    <th className="px-4 py-3 w-24 text-right">Qté</th>
                                    <th className="px-4 py-3 w-32 text-right">Prix Unit.</th>
                                    <th className="px-4 py-3 w-24 text-right">TVA %</th>
                                    <th className="px-4 py-3 w-32 text-right">Total</th>
                                    <th className="px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {formData.items?.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2">
                                            <select
                                                required
                                                value={item.productId}
                                                onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                className="w-full px-2 py-1 rounded border border-slate-200 focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 rounded border border-slate-200 text-right focus:ring-1 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 rounded border border-slate-200 text-right focus:ring-1 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.tax}
                                                onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 rounded border border-slate-200 text-right focus:ring-1 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium">
                                            {item.total.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-medium">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-right">Total HT</td>
                                    <td className="px-4 py-3 text-right">{totalHT.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-right">Total TVA</td>
                                    <td className="px-4 py-3 text-right">{totalTax.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                                <tr className="text-lg font-bold text-slate-900">
                                    <td colSpan={4} className="px-4 py-3 text-right">Total TTC</td>
                                    <td className="px-4 py-3 text-right">{totalTTC.toLocaleString()} {formData.currency}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/sales')}
                        className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Save size={20} />
                        Enregistrer la facture
                    </button>
                </div>
            </form>
        </div >
    );
}
