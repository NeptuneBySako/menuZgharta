import React, { useEffect, useState } from "react";
import { ref, set, push, get, remove, update } from "firebase/database";
import * as database from "../../firebase/firebase.config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";

const Categories = () => {
  const [name, setName] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedData, setSelectedData] = useState();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState();
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    getCategories();
    getSections();
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
      // Sort by section, then by position
      arr.sort((a, b) => {
        if (a.section === b.section) {
          return a.position - b.position;
        }
        return a.section.localeCompare(b.section);
      });
      setCategories(arr);
    }
  };

  const getSections = async () => {
    const dataRef = ref(database?.default?.db, "sections");
    const snapshot = await get(dataRef);
    if (snapshot.exists()) {
      let data = snapshot.val();
      let arr = Object.keys(data).map((id) => {
        return {
          ...data[id],
          id: id,
        };
      });
      setSelectedSection(arr?.[0]?.id);
      setSections(arr);
    }
  };

  const saveData = async () => {
    if (!isUpdate) {
      try {
        const newDocRef = push(ref(database?.default?.db, "categories"));
        const newPosition =
          categories.filter((cat) => cat.section === selectedSection).length +
          1;

        await set(newDocRef, {
          title: name,
          position: newPosition,
          section: selectedSection,
        });
        alert("New category created");
        getCategories();
        setName("");
      } catch (err) {
        alert("Error: " + err.message);
      }
    } else {
      try {
        const dataRef = ref(
          database?.default?.db,
          "categories/" + selectedData.id
        );
        await set(dataRef, {
          title: name,
          position: selectedData.position, // Keep existing position when updating
          section: selectedSection,
        });
        alert("Category updated successfully");
        getCategories();
        setIsUpdate(false);
        setSelectedData();
        setName("");
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const deleteCategory = async (id) => {
    try {
      const dataRef = ref(database?.default?.db, "categories/" + id);
      await remove(dataRef);
      alert("Category deleted successfully");
      getCategories();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
  };

  const handleDragOver = (e, item) => {
    e.preventDefault();
    // Only allow drop if the target is in the same section
    if (draggedItem && draggedItem.section === item.section) {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.section !== targetItem.section) {
      setDraggedItem(null);
      return;
    }

    // Find all categories in the same section
    const sectionCategories = categories.filter(
      (cat) => cat.section === draggedItem.section
    );

    // Find current and target indices in the full array
    const currentIndex = categories.findIndex(
      (cat) => cat.id === draggedItem.id
    );
    const targetIndex = categories.findIndex((cat) => cat.id === targetItem.id);

    if (
      currentIndex === -1 ||
      targetIndex === -1 ||
      currentIndex === targetIndex
    ) {
      setDraggedItem(null);
      return;
    }

    // Create a new array with the category moved to the new position
    const newCategories = [...categories];
    const [removed] = newCategories.splice(currentIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    // Update positions for all categories in the section
    const updatedCategories = newCategories.map((cat) => {
      if (cat.section === draggedItem.section) {
        // Find the new position within the section
        const pos = newCategories
          .filter((c) => c.section === draggedItem.section)
          .findIndex((c) => c.id === cat.id);
        return {
          ...cat,
          position: pos + 1,
        };
      }
      return cat;
    });

    setCategories(updatedCategories);

    // Update positions in Firebase
    try {
      const updates = {};
      updatedCategories
        .filter((cat) => cat.section === draggedItem.section)
        .forEach((cat) => {
          updates[`categories/${cat.id}/position`] = cat.position;
        });

      await update(ref(database?.default?.db), updates);
    } catch (err) {
      console.error("Error updating categories:", err);
      getCategories(); // Revert on error
    }

    setDraggedItem(null);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col items-start border-b border-gray-200 w-full p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">
          {isUpdate ? "Update Category" : "Add New Category"}
        </h2>
        <div className="flex items-center gap-3 w-full">
          <input
            type="text"
            onChange={(e) => setName(e.target.value)}
            value={name}
            placeholder="Category name"
            className="flex-1 p-2 border rounded"
          />
          <select
            className="flex-1 p-2 border rounded"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            {sections?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <button
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 mt-5"
          onClick={saveData}
        >
          {isUpdate ? "Update" : "Add"}
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left border">No.</th>
              <th className="p-3 text-left border">Name</th>
              <th className="p-3 text-left border">Section</th>
              <th className="p-3 text-left border">Position</th>
              <th className="p-3 text-left border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const sectionCategories = categories
                .filter((cat) => cat.section === section.id)
                .sort((a, b) => a.position - b.position);

              if (sectionCategories.length === 0) return null;

              return (
                <React.Fragment key={`section-${section.id}`}>
                  <tr className="bg-gray-100">
                    <td colSpan="5" className="p-3 font-bold border">
                      {capitalizeFirstLetter(section.title)}
                    </td>
                  </tr>
                  {sectionCategories.map((category, index) => (
                    <tr
                      key={category.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, category)}
                      onDragOver={(e) => handleDragOver(e, category)}
                      onDrop={(e) => handleDrop(e, category)}
                      className={`hover:bg-gray-50 ${
                        draggedItem?.id === category.id ? "bg-blue-50" : ""
                      }`}
                      style={{
                        cursor:
                          draggedItem?.section === category.section
                            ? "move"
                            : "no-drop",
                        opacity:
                          draggedItem &&
                          draggedItem.section !== category.section
                            ? 0.5
                            : 1,
                      }}
                    >
                      <td className="p-3 border">{index + 1}</td>
                      <td className="p-3 border">
                        {capitalizeFirstLetter(category.title)}
                      </td>
                      <td className="p-3 border">
                        {capitalizeFirstLetter(section.title)}
                      </td>
                      <td className="p-3 border">{category.position}</td>
                      <td className="p-3 border">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => {
                              setIsUpdate(true);
                              setSelectedData(category);
                              setName(category.title);
                              setSelectedSection(category.section);
                            }}
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deleteCategory(category.id)}
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
  );
};

export default Categories;
