import { useEffect, useState } from "react";
import { ref, set, push, get, remove } from "firebase/database";
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
      setSections(arr);
    }
  };

  const saveData = async () => {
    if (!isUpdate) {
      try {
        const newDocRef = push(ref(database?.default?.db, "categories"));
        await set(newDocRef, {
          title: name,
          position: position,
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
        const dataRef = ref(database?.default?.db, "categories/" + selectedData.id);
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
          <input
            type="number"
            onChange={(e) => {
              setPosition(e.target.value);
            }}
            value={position}
            placeholder="Position in menu"
            className="mt-3 mb-3 border p-2 mr-3"
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
              return (
                <tr>
                  <td>{index + 1}</td>
                  <td>{capitalizeFirstLetter(item.title)}</td>
                  <td>
                    {item?.section
                      ? capitalizeFirstLetter(
                          sections?.find((x) => x?.id === item?.section)?.title
                        )
                      : ""}
                  </td>
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
