import React, { useEffect, useState } from "react";
import { ref, set, push, get, remove, update } from "firebase/database";
import * as database from "../../firebase/firebase.config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";

const Items = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCat, setSelectedCat] = useState();
  const [isUpdate, setIsUpdate] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedData, setSelectedData] = useState();
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [search, setSearch] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    getCategories();
    getItems();
  }, []);

  const getCategories = async () => {
    const dataRef = ref(database?.default?.db, "categories");
    const snapshot = await get(dataRef);
    if (snapshot.exists()) {
      let data = snapshot.val();
      let arr = Object.keys(data).map((id) => {
        return {
          ...data[id],
          id: id,
        };
      });
      setSelectedCat(arr?.[0]?.id);
      setCategories(arr);
    }
  };

  const saveData = async () => {
    if (!isUpdate) {
      try {
        const newDocRef = push(ref(database?.default?.db, "items"));
        await set(newDocRef, {
          title: name,
          price: price,
          category_id: selectedCat,
          description: description,
          position:
            items.filter((item) => item.category_id === selectedCat).length + 1,
        });
        alert("New item created");
        getItems();
        setName("");
        setPrice("");
        setDescription("");
      } catch (err) {
        alert("Error: " + err.message);
      }
    } else {
      try {
        const dataRef = ref(database?.default?.db, "items/" + selectedData.id);
        await set(dataRef, {
          title: name,
          price: price,
          category_id: selectedCat,
          description: description,
          position: selectedData.position,
        });
        alert("Item updated successfully");
        getItems();
        setIsUpdate(false);
        setSelectedData();
        setName("");
        setPrice("");
        setDescription("");
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const deleteItem = async (id) => {
    try {
      const dataRef = ref(database?.default?.db, "items/" + id);
      await remove(dataRef);
      alert("Item deleted successfully");
      getItems();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const getItems = async () => {
    const dataRef = ref(database?.default?.db, "items");
    const snapshot = await get(dataRef);
    if (snapshot.exists()) {
      let data = snapshot.val();
      let arr = Object.keys(data).map((id) => {
        return {
          ...data[id],
          id: id,
          position: data[id].position || 0,
        };
      });

      // Sort by category, then by position
      arr.sort((a, b) => {
        if (a.category_id === b.category_id) {
          return (a.position || 0) - (b.position || 0);
        }
        return a.category_id?.localeCompare(b.category_id);
      });

      setItems(arr);
      setAllItems(arr);
    }
  };

  const initializePositions = async () => {
    try {
      // Get current items
      const snapshot = await get(ref(database?.default?.db, "items"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const updates = {};

        // Group items by category
        const categories = {};
        Object.keys(data).forEach((id) => {
          const categoryId = data[id].category_id || "uncategorized";
          if (!categories[categoryId]) {
            categories[categoryId] = [];
          }
          categories[categoryId].push({ id, ...data[id] });
        });

        // Assign positions within each category
        Object.keys(categories).forEach((categoryId) => {
          categories[categoryId].forEach((item, index) => {
            updates[`items/${item.id}/position`] = index + 1;
          });
        });

        // Apply updates
        await update(ref(database?.default?.db), updates);
        alert("Positions initialized successfully");
        getItems();
      }
    } catch (err) {
      alert("Error initializing positions: " + err.message);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    if (value === "") {
      setItems(allItems);
    } else {
      const filteredData = allItems.filter((x) =>
        x.title.toLowerCase().includes(value.toLowerCase())
      );
      setItems(filteredData);
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
  };

  const handleDragOver = (e, item) => {
    e.preventDefault();
    // Only allow drop if the target is in the same category
    if (draggedItem && draggedItem.category_id === item.category_id) {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.category_id !== targetItem.category_id) {
      setDraggedItem(null);
      return;
    }

    // Find all items in the same category
    const categoryItems = items.filter(
      (item) => item.category_id === draggedItem.category_id
    );

    // Find the index of the dragged item
    const draggedIndex = items.findIndex((item) => item.id === draggedItem.id);

    // Find the index of the target item
    const targetIndex = items.findIndex((item) => item.id === targetItem.id);

    if (
      draggedIndex === -1 ||
      targetIndex === -1 ||
      draggedIndex === targetIndex
    ) {
      setDraggedItem(null);
      return;
    }

    // Create a new array with the item moved to the new position
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update positions for all items in the category
    const updatedItems = newItems.map((item) => {
      if (item.category_id === draggedItem.category_id) {
        // Find the new position within the category
        const pos = newItems
          .filter((i) => i.category_id === draggedItem.category_id)
          .findIndex((i) => i.id === item.id);
        return {
          ...item,
          position: pos + 1,
        };
      }
      return item;
    });

    setItems(updatedItems);

    // Update positions in Firebase
    try {
      const updates = {};
      updatedItems
        .filter((item) => item.category_id === draggedItem.category_id)
        .forEach((item) => {
          updates[`items/${item.id}/position`] = item.position;
        });

      await update(ref(database?.default?.db), updates);
    } catch (err) {
      console.error("Error updating items:", err);
      getItems(); // Revert on error
    }

    setDraggedItem(null);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col items-start border-b border-gray-200 w-full p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">
          {isUpdate ? "Update Item" : "Add New Item"}
        </h2>
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <input
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              placeholder="Item name"
              className="flex-1 min-w-[200px] p-2 border rounded"
            />
            <input
              type="number"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              placeholder="Price"
              className="flex-1 min-w-[120px] p-2 border rounded"
            />
            <select
              className="flex-1 min-w-[200px] p-2 border rounded"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              {categories?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {/* <button
              onClick={initializePositions}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Initialize Positions
            </button> */}
          </div>
          <textarea
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            placeholder="Description"
            rows="3"
            className="w-full p-2 border rounded mb-3"
          />
          <button
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            onClick={saveData}
          >
            {isUpdate ? "Update" : "Add"}
          </button>
        </div>
      </div>

      <div className="w-full p-2">
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search items..."
            className="p-2 border rounded w-full max-w-md"
            onChange={(e) => handleSearch(e.target.value)}
            value={search}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left border">No.</th>
                <th className="p-3 text-left border">Name</th>
                <th className="p-3 text-left border">Category</th>
                <th className="p-3 text-left border">Price</th>
                <th className="p-3 text-left border">Position</th>
                <th className="p-3 text-left border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const categoryItems = items
                  .filter((item) => item.category_id === category.id)
                  .sort((a, b) => (a.position || 0) - (b.position || 0));

                if (categoryItems.length === 0) return null;

                return (
                  <React.Fragment key={`category-${category.id}`}>
                    <tr className="bg-gray-100">
                      <td colSpan="6" className="p-3 font-bold border">
                        {capitalizeFirstLetter(category.title)}
                      </td>
                    </tr>
                    {categoryItems.map((item, index) => (
                      <tr
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOver(e, item)}
                        onDrop={(e) => handleDrop(e, item)}
                        className={`hover:bg-gray-50 ${
                          draggedItem?.id === item.id ? "bg-blue-50" : ""
                        }`}
                        style={{
                          cursor:
                            draggedItem?.category_id === item.category_id
                              ? "move"
                              : "no-drop",
                          opacity:
                            draggedItem &&
                            draggedItem.category_id !== item.category_id
                              ? 0.5
                              : 1,
                        }}
                      >
                        <td className="p-3 border">{index + 1}</td>
                        <td className="p-3 border">
                          {capitalizeFirstLetter(item.title)}
                        </td>
                        <td className="p-3 border">
                          {capitalizeFirstLetter(category.title)}
                        </td>
                        <td className="p-3 border">
                          {item.price ? `$${item.price}` : ""}
                        </td>
                        <td className="p-3 border">{item.position || "N/A"}</td>
                        <td className="p-3 border">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => {
                                setIsUpdate(true);
                                setSelectedData(item);
                                setName(item.title);
                                setDescription(item.description);
                                setPrice(item.price);
                                setSelectedCat(item.category_id);
                              }}
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteItem(item.id)}
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Items;
