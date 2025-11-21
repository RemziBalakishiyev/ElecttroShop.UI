import { useState } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { Button } from "../components/commons/Button";
import { Table } from "../components/commons/Table";
import { Pagination } from "../components/commons/Pagination";
import { FilterModal } from "../components/commons/FilterModal";
import { AddItemModal } from "../components/modals/AddItemModal";

// Sample data type
interface Item {
  id: string;
  name: string;
  image: string;
  model: string;
  type: string;
  store: string;
  amount: string;
  project: string;
  account: string;
}

// Sample data
const sampleData: Item[] = [
  {
    id: "1",
    name: "Gas Kitting",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "G-7893",
    type: "IE Project Items",
    store: "22 House Store",
    amount: "1 pcs",
    project: "HQ",
    account: "Activated",
  },
  {
    id: "2",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "Co-7898",
    type: "IE Project Items",
    store: "HQ Main Store",
    amount: "3 pcs",
    project: "HQ",
    account: "Activated",
  },
  {
    id: "3",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "G-7893",
    type: "IE Project Items",
    store: "HQ Main Store",
    amount: "5 pcs",
    project: "HQ",
    account: "Need Invitation",
  },
  {
    id: "4",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "Co-7898",
    type: "IE Project Items",
    store: "22 House Store",
    amount: "2 pcs",
    project: "HQ",
    account: "Activated",
  },
  {
    id: "5",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "G-7893",
    type: "IE Project Items",
    store: "HQ Main Store",
    amount: "4 pcs",
    project: "HQ",
    account: "Activated",
  },
  {
    id: "6",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "Co-7898",
    type: "IE Project Items",
    store: "22 House Store",
    amount: "6 pcs",
    project: "HQ",
    account: "Need Invitation",
  },
  {
    id: "7",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "G-7893",
    type: "IE Project Items",
    store: "HQ Main Store",
    amount: "3 pcs",
    project: "HQ",
    account: "Activated",
  },
  {
    id: "8",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "Co-7898",
    type: "IE Project Items",
    store: "22 House Store",
    amount: "2 pcs",
    project: "HQ",
    account: "Activated",
  },
  {
    id: "9",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "G-7893",
    type: "IE Project Items",
    store: "HQ Main Store",
    amount: "7 pcs",
    project: "HQ",
    account: "Need Invitation",
  },
  {
    id: "10",
    name: "Condet",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
    model: "Co-7898",
    type: "IE Project Items",
    store: "22 House Store",
    amount: "5 pcs",
    project: "HQ",
    account: "Activated",
  },
];

// Duplicate data to have 40 items total
const allItems = [...sampleData, ...sampleData, ...sampleData, ...sampleData];

export const ItemsPage = () => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    selectedStores: string[];
    storeLocation: string | null;
  }>({ selectedStores: [], storeLocation: null });

  // Filter data based on search and filters
  const filteredData = allItems.filter((item) => {
    // Search filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase());

    // Store filter
    const matchesStore =
      activeFilters.selectedStores.length === 0 ||
      activeFilters.selectedStores.some((storeValue) => {
        if (storeValue === "hq") return item.store === "HQ Main Store";
        if (storeValue === "22h") return item.store === "22 House Store";
        if (storeValue === "tafo") return item.store === "Tafo House Store";
        return false;
      });

    return matchesSearch && matchesStore;
  });

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(currentData.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleApplyFilter = (filters: {
    selectedStores: string[];
    storeLocation: string | null;
  }) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filter changes
    console.log("Filters applied:", filters);
  };

  const handleAddItem = (data: any) => {
    console.log("New item data:", data);
    // TODO: API çağırışı ilə yeni item əlavə et
    // Uğurlu olduqdan sonra table-ı yenilə
  };

  const columns = [
    {
      key: "name",
      label: "Item Name",
      sortable: true,
      render: (item: Item) => (
        <span className="font-medium text-neutral-900">{item.name}</span>
      ),
    },
    {
      key: "image",
      label: "Image",
      render: (item: Item) => (
        <img
          src={item.image}
          alt={item.name}
          className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
        />
      ),
    },
    { key: "model", label: "Model" },
    { key: "type", label: "Type" },
    { key: "store", label: "Store" },
    { key: "amount", label: "Amount" },
    { key: "project", label: "Project" },
    {
      key: "account",
      label: "Account",
      render: (item: Item) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            item.account === "Activated"
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          }`}
        >
          {item.account}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">All Items</h1>
          <p className="text-sm text-neutral-600 mt-1">Items detail Information</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border border-neutral-200">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute top-2.5 left-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search Item"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => setIsAddItemOpen(true)}
          >
            Add Item
          </Button>
          <Button
            variant="outline"
            icon={<Filter size={18} />}
            onClick={() => setIsFilterOpen(true)}
          >
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <Table
          columns={columns}
          data={currentData}
          selectable
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Filter Modal */}
      <FilterModal
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilter}
      />

      {/* Add Item Modal */}
      <AddItemModal
        open={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAdd={handleAddItem}
      />
    </div>
  );
};

