import React from "react";

const ItemRow = ({ name, description, price }) => {
  return (
    <div className="flex items-start justify-between w-full mb-4 pl-4 pr-4">
      <div className="flex flex-col items-start w-[90%]">
        <h4 className="text-[#43A6C6] text-left text-lg">{name}</h4>
        <p className="text-left text-xs">{description}</p>
      </div>
      <div>
        <h4>{price ? `$${price}` : ""}</h4>
      </div>
    </div>
  );
};

export default ItemRow;
