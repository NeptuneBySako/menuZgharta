import React from "react";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";

const SectionTitle = ({ title }) => {
  return (
    <h2 className="bg-[#43A6C6] w-full text-left p-3 mb-4 text-2xl">
      {capitalizeFirstLetter(title)}
    </h2>
  );
};

export default SectionTitle;
