import { useEffect, useState } from "react";
import { ref, set, push, get, remove } from "firebase/database";
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
  const [search, setSearch] = useState([]);

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
        });
        alert("New item created");
        getItems();
        setName("");
        setPrice("");
        setSelectedCat("");
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
        });
        alert("Item updated successfully");
        getItems();
        setIsUpdate(false);
        setSelectedData();
        setName("");
        setPrice("");
        setSelectedCat("");
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
        };
      });

      setItems(arr);
      setAllItems(arr);
    }
  };

  const handleSearch = (value) => {
    if (value === "") {
      setSearch("");
      let allData = allItems;
      setItems(allData);
    } else if (value.length < search.length) {
      setSearch(value);
      let allData = allItems;
      let filteredData = allData.filter((x) =>
        x.title.toLowerCase().includes(value.toLowerCase())
      );

      setItems(filteredData);
    } else {
      setSearch(value);
      let allData = items;
      let filteredData = allData.filter((x) =>
        x.title.toLowerCase().includes(value.toLowerCase())
      );
      setItems(filteredData);
    }
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
              {categories?.map((item) => {
                return <option value={item?.id}>{item?.title}</option>;
              })}
            </select>
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
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, index) => {
              return (
                <tr>
                  <td>{index + 1}</td>
                  <td>{capitalizeFirstLetter(item.title)}</td>
                  <td>
                    {capitalizeFirstLetter(
                      categories.find((x) => x.id === item?.category_id)?.title
                    ) ?? ""}
                  </td>
                  <td>{item.price ? `$${item?.price}` : ""}</td>
                  <td>
                    <div className="flex items-center justify-center">
                      <button
                        className="mr-5"
                        onClick={() => {
                          setIsUpdate(true);
                          setSelectedData(item);
                          setName(item?.title);
                          setDescription(item?.description);
                          setPrice(item?.price);
                          setSelectedCat(item?.category_id);
                        }}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => {
                          deleteItem(item?.id);
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
