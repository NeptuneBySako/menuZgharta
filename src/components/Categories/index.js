import { useEffect, useState } from "react";
import { ref, set, push, get, remove, update } from "firebase/database";
import * as database from "../../firebase/firebase.config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";

const Categories = () => {
  const [name, setName] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedData, setSelectedData] = useState();
  const [position, setPosition] = useState();
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
        await set(newDocRef, {
          title: name,
          position: categories?.length + 1,
          section: selectedSection,
        });
        alert("New category created");
        getCategories();
        setName("");
        setPosition("");
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
          position: position,
          section: selectedSection,
        });
        alert("Category updated successfully");
        getCategories();
        setIsUpdate(false);
        setSelectedData();
        setName("");
        setPosition("");
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

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Get the target category to determine the section
    const targetCategory = categories[targetIndex];
    const targetSection = targetCategory.section;

    // Filter categories by the target section
    const sectionCategories = categories.filter(
      (cat) => cat.section === targetSection
    );

    // Find the actual position within the section
    let actualPositionInSection = 0;
    for (let i = 0; i < targetIndex; i++) {
      if (categories[i].section === targetSection) {
        actualPositionInSection++;
      }
    }

    // Find the current index of the dragged item
    const currentIndex = categories.findIndex(
      (item) => item.id === draggedItem.id
    );

    if (currentIndex !== -1 && currentIndex !== targetIndex) {
      // Create a new array with the item moved to the new position
      const newCategories = [...categories];
      const [removed] = newCategories.splice(currentIndex, 1);

      // Update the section if moving to a different section
      if (draggedItem.section !== targetSection) {
        removed.section = targetSection;
      }

      newCategories.splice(targetIndex, 0, removed);

      // Update positions for all categories in the target section
      const updatedCategories = newCategories.map((item, index) => {
        // Only update positions for items in the target section
        if (item.section === targetSection) {
          // Find the position within the section
          let pos = 0;
          for (let i = 0; i < index; i++) {
            if (newCategories[i].section === targetSection) {
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

      setCategories(updatedCategories);

      // Update all positions in Firebase
      try {
        // Create a batch update object
        const updates = {};

        // Only update categories in the target section
        updatedCategories
          .filter((cat) => cat.section === targetSection)
          .forEach((item) => {
            updates[`categories/${item.id}/position`] = item.position;
            // Update section if changed
            if (
              item.id === draggedItem.id &&
              draggedItem.section !== targetSection
            ) {
              updates[`categories/${item.id}/section`] = targetSection;
            }
          });

        // Get the database reference
        const dbRef = ref(database?.default?.db);

        // Update all positions in a single transaction
        await update(dbRef, updates);

        alert("Categories updated successfully");
      } catch (err) {
        console.error("Error updating categories:", err);
        alert("Error updating categories: " + err.message);
        // Revert if there's an error
        getCategories();
      }
    }

    setDraggedItem(null);
  };

  return (
    <div>
      <div className="flex flex-col items-start border-b border-b-black w-full p-2">
        <h2>{isUpdate ? "Update Category" : "Add New Category"}</h2>
        <div className="flex items-center justify-start">
          <input
            type="text"
            onChange={(e) => {
              setName(e.target.value);
            }}
            value={name}
            placeholder="Category name"
            className="mt-3 mb-3 border p-2 mr-3"
          />
          <select
            className="mt-3 mb-3 border p-2 mr-3"
            value={selectedSection}
            onChange={(e) => {
              setSelectedSection(e.target.value);
            }}
          >
            {sections?.map((item) => {
              return <option value={item?.id}>{item?.title}</option>;
            })}
          </select>
          {/* <input
            type="number"
            onChange={(e) => {
              setPosition(e.target.value);
            }}
            value={position}
            placeholder="Position in menu"
            className="mt-3 mb-3 border p-2 mr-3"
          /> */}
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
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Section</th>
              <th>Position In Menu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((item, index) => {
              const sectionTitle = sections.find(
                (s) => s.id === item.section
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
                  <td>{capitalizeFirstLetter(sectionTitle)}</td>
                  <td>{item.position}</td>
                  <td>
                    <div className="flex items-center justify-center">
                      <button
                        className="mr-5"
                        onClick={() => {
                          setIsUpdate(true);
                          setSelectedData(item);
                          setName(item?.title);
                          setPosition(item?.position);
                          setSelectedSection(item?.section);
                        }}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => {
                          deleteCategory(item?.id);
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

export default Categories;
