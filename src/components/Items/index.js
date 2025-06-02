import { useEffect, useState } from "react";
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
          position: 0, // Default position (will be updated when items are reordered)
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
          position: selectedData.position || 0, // Maintain existing position
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
          position: data[id].position || 0, // Default to 0 if position doesn't exist
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

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Get the target item to determine the category
    const targetItem = items[targetIndex];
    const targetCategory = targetItem.category_id;

    // Find the current index of the dragged item
    const currentIndex = items.findIndex((item) => item.id === draggedItem.id);

    if (currentIndex !== -1 && currentIndex !== targetIndex) {
      // Create a new array with the item moved to the new position
      const newItems = [...items];
      const [removed] = newItems.splice(currentIndex, 1);

      // Update the category if moving to a different category
      if (draggedItem.category_id !== targetCategory) {
        removed.category_id = targetCategory;
      }

      newItems.splice(targetIndex, 0, removed);

      // Update positions for all items in the target category
      const updatedItems = newItems.map((item, index) => {
        // Only update positions for items in the target category
        if (item.category_id === targetCategory) {
          // Find the position within the category
          let pos = 0;
          for (let i = 0; i < index; i++) {
            if (newItems[i].category_id === targetCategory) {
              pos++;
            }
          }
          return {
            ...item,
            position: pos + 1,
          };
        }
        return item;
      });

      setItems(updatedItems);

      // Update all positions in Firebase
      try {
        // Create a batch update object
        const updates = {};

        // Only update items in the target category
        updatedItems
          .filter((item) => item.category_id === targetCategory)
          .forEach((item) => {
            updates[`items/${item.id}/position`] = item.position;
            // Update category if changed
            if (
              item.id === draggedItem.id &&
              draggedItem.category_id !== targetCategory
            ) {
              updates[`items/${item.id}/category_id`] = targetCategory;
            }
          });

        // Get the database reference
        const dbRef = ref(database?.default?.db);

        // Update all positions in a single transaction
        await update(dbRef, updates);

        alert("Items updated successfully");
      } catch (err) {
        console.error("Error updating items:", err);
        alert("Error updating items: " + err.message);
        // Revert if there's an error
        getItems();
      }
    }

    setDraggedItem(null);
  };

  return (
    <div>
      <div className="flex flex-col items-start border-b border-b-black w-full p-2">
        <h2>{isUpdate ? "Update Item" : "Add New Item"}</h2>
        <div>
          <div className="flex items-center justify-start">
            <input
              type="text"
              onChange={(e) => {
                setName(e.target.value);
              }}
              value={name}
              placeholder="Item name"
              className="mt-3 mb-3 border p-2 mr-3"
            />
            <input
              type="number"
              onChange={(e) => {
                setPrice(e.target.value);
              }}
              value={price}
              placeholder="Price"
              className="mt-3 mb-3 border p-2 mr-3"
            />
            <select
              className="mt-3 mb-3 border p-2 mr-3"
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
              }}
            >
              {categories?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <button
              onClick={initializePositions}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Initialize Positions
            </button>
          </div>
          <textarea
            type="text"
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            value={description}
            placeholder="Description"
            rows="5"
            className="mt-3 mb-3 border p-2 mr-3 w-full"
          />
          <button
            className="flex items-center justify-center bg-slate-200 w-full pt-2 pb-2 pl-4 pr-4"
            onClick={() => {
              saveData();
            }}
          >
            {isUpdate ? "Update" : "Add"}
          </button>
        </div>
      </div>
      <div className="w-full p-2">
        <div className="flex items-end justify-end">
          <input
            type="text"
            placeholder="Search"
            className="mt-3 mb-3 border p-2 mr-3"
            onChange={(e) => {
              handleSearch(e.target.value);
            }}
            value={search}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Position</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, index) => {
              const categoryTitle = categories.find(
                (c) => c.id === item.category_id
              )?.title;
              return (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    cursor: "move",
                    backgroundColor:
                      draggedItem?.id === item.id ? "#f0f0f0" : "transparent",
                  }}
                >
                  <td>{index + 1}</td>
                  <td>{capitalizeFirstLetter(item.title)}</td>
                  <td>{capitalizeFirstLetter(categoryTitle)}</td>
                  <td>{item.price ? `$${item.price}` : ""}</td>
                  <td>{item.position || "N/A"}</td>
                  <td>
                    <div className="flex items-center justify-center">
                      <button
                        className="mr-5"
                        onClick={() => {
                          setIsUpdate(true);
                          setSelectedData(item);
                          setName(item.title);
                          setDescription(item.description);
                          setPrice(item.price);
                          setSelectedCat(item.category_id);
                        }}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => {
                          deleteItem(item.id);
                        }}
                      >
                        <FiTrash2 />
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
  );
};

export default Items;
