import { useEffect, useState } from "react";
import { ref, set, push, get, remove, update } from "firebase/database";
import * as database from "../../firebase/firebase.config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";

const Sections = () => {
  const [name, setName] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedData, setSelectedData] = useState();
  const [position, setPosition] = useState();
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    getSections();
  }, []);

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
      // Sort by position
      arr.sort((a, b) => a.position - b.position);
      setSections(arr);
    }
  };

  const saveData = async () => {
    if (!isUpdate) {
      try {
        const newDocRef = push(ref(database?.default?.db, "sections"));
        await set(newDocRef, {
          title: name,
          position: sections?.length + 1,
        });
        alert("New section created");
        getSections();
        setName("");
        setPosition("");
      } catch (err) {
        alert("Error: " + err.message);
      }
    } else {
      try {
        const dataRef = ref(
          database?.default?.db,
          "sections/" + selectedData.id
        );
        await set(dataRef, {
          title: name,
          position: position,
        });
        alert("Section updated successfully");
        getSections();
        setIsUpdate(false);
        setSelectedData();
        setName("");
        setPosition("");
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const deleteSection = async (id) => {
    try {
      const dataRef = ref(database?.default?.db, "sections/" + id);
      await remove(dataRef);
      alert("Section deleted successfully");
      getSections();
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

    // Find the current index of the dragged item
    const currentIndex = sections.findIndex(
      (item) => item.id === draggedItem.id
    );

    if (currentIndex !== -1 && currentIndex !== targetIndex) {
      // Create a new array with the item moved to the new position
      const newSections = [...sections];
      const [removed] = newSections.splice(currentIndex, 1);
      newSections.splice(targetIndex, 0, removed);

      // Update positions based on new order
      const updatedSections = newSections.map((item, index) => ({
        ...item,
        position: index + 1,
      }));

      setSections(updatedSections);

      // Update all positions in Firebase
      try {
        // Create a batch update object
        const updates = {};

        updatedSections.forEach((item) => {
          // Create proper reference path
          updates[`sections/${item.id}/position`] = item.position;
        });

        // Get the database reference
        const dbRef = ref(database?.default?.db);

        // Update all positions in a single transaction
        await update(dbRef, updates);

        alert("Positions updated successfully");
      } catch (err) {
        console.error("Error updating positions:", err);
        alert("Error updating positions: " + err.message);
        // Revert if there's an error
        getSections();
      }
    }

    setDraggedItem(null);
  };

  return (
    <div>
      <div className="flex flex-col items-start border-b border-b-black w-full p-2">
        <h2>{isUpdate ? "Update Section" : "Add New Section"}</h2>
        <div className="flex items-center justify-start">
          <input
            type="text"
            onChange={(e) => {
              setName(e.target.value);
            }}
            value={name}
            placeholder="Section name"
            className="mt-3 mb-3 border p-2 mr-3"
          />
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
              <th>Position In Menu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections?.map((item, index) => {
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
                        }}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => {
                          deleteSection(item?.id);
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

export default Sections;
