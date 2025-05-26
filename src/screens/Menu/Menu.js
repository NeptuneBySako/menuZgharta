import { Fragment, useEffect, useState } from "react";
import SectionTitle from "../../components/SectionTitle";
import ItemRow from "../../components/ItemRow";
import { data as MenuData } from "../../data";
import { useNavigate } from "react-router-dom";
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import * as database from "../../firebase/firebase.config";
import SectionsTabs from "../../components/SectionsTabs";
import CategoriesTabs from "../../components/CategoriesTabs";
import RestImage from "../../assets/image1.jpg";
import Logo from "../../assets/logo.png";
import RestImage2 from "../../assets/image2.jpeg";
const Menu = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState();
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    getSections();
    getImage();
  }, []);

  const getImage = async () => {
    const dataRef = ref(database?.default?.db, "images/");
    const snapshot = await get(dataRef);
    if (snapshot.exists()) {
      let data = snapshot.val();

      console.log(data?.main_image?.imageUrl, "data");
      setImageUrl(data?.main_image?.imageUrl);
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
      getCategories(arr[0].id);
      console.log(arr, "arr");
      setSections(arr);
    }
  };

  const getCategories = async (id) => {
    setSelectedSection(id);
    console.log(id, "id");
    //get categories
    const dataRef = ref(database?.default?.db, "categories");
    const categoriesQuery = query(
      dataRef,
      orderByChild("section"),
      equalTo(id)
    );

    const snapshot = await get(categoriesQuery);
    let categoriesArr = [];
    if (snapshot.exists()) {
      let data = snapshot.val();
      categoriesArr = Object.keys(data).map((id) => {
        return {
          ...data[id],
          id: id,
        };
      });
    }
    getItems(categoriesArr[0]?.id);
    setCategories(categoriesArr);
  };

  const getItems = async (id) => {
    console.log(id, "id");
    let itemsArr = [];
    const itemsRef = ref(database?.default?.db, "items");
    const itemsQuery = query(
      itemsRef,
      orderByChild("category_id"),
      equalTo(id)
    );

    const snapshot = await get(itemsQuery);
    if (snapshot.exists()) {
      let data = snapshot.val();
      itemsArr = Object.keys(data).map((id) => {
        return {
          ...data[id],
          id: id,
        };
      });
    }

    setItems(itemsArr);
  };

  useEffect(() => {
    console.log(selectedSection, "selectedSection");
  }, [sections, categories, items, selectedSection]);
  return (
    <Fragment>
      <div className="p-2 flex flex-row items-center justify-between">
        <img src={Logo} alt="logo" className="w-20 h-20" />
        <div className="flex flex-col items-end">
          <p className="text-left text-xs">Neptune grill house</p>
          <p className="text-left text-xs">Bnachii Lake</p>
          <p className="text-left text-xs">76/776774 or 71/006575</p>
        </div>
        <button
          className="hidden lg:block p-2 bg-slate-300 mb-5 rounded-xl  h-fit items-center "
          onClick={() => {
            navigate("/dashboard");
          }}
        >
          Login
        </button>
      </div>
      <div
        className="flex flex-col items-start w-screen bg-cover bg-center p-3 h-72 relative"
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : `url(${RestImage2})`, //imageUrl != "" ? `url(${imageUrl})` : "#43A6C6",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute bottom-4">
          <SectionsTabs
            sections={sections}
            onClick={(section) => {
              getCategories(section?.id);
              console.log(section, "section");
            }}
          />
          <CategoriesTabs
            categories={categories}
            onClick={(cat) => {
              getItems(cat?.id);
              console.log(cat, "cat");
            }}
            selectedSection={selectedSection}
          />
        </div>
      </div>
      <div className="p-3">
        <div className="flex flex-col items-start w-full mt-2 border-2 rounded-lg border-[#43A6C6] pt-2">
          {items.map((item) => {
            return (
              <ItemRow
                name={item?.title}
                description={item.description}
                price={item.price}
              />
            );
          })}
        </div>
      </div>
    </Fragment>
  );
};

export default Menu;
