import React from "react";
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { removeCartItem, updateQuantity } from "../redux/userSlice";

const CartItemCard = ({ data }) => {
  const dispatch = useDispatch();
  const handleIncrease = (id, currentQuantity) => {
    dispatch(updateQuantity({ id, quantity: currentQuantity + 1 }));
  };
  const handleDecrease = (id, currentQuantity) => {
    if (currentQuantity > 1)
      dispatch(updateQuantity({ id, quantity: currentQuantity - 1 }));
  };
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow border">
      <div className="flex items-center gap-4">
        <img
          src={data.image}
          alt=""
          className="w-20 h-20 object-cover rounded-lg border"
        />
        <div>
          <h1 className="font-medium text-gray-800">{data.name}</h1>
          <p className="text-sm text-gray-500">
            ₹{data.price}x{data.quantity}
          </p>
          <p className="font-bold text-gray-900">
            ₹{data.price * data.quantity}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer">
          <FaMinus
            size={12}
            onClick={() => handleDecrease(data.id, data.quantity)}
          />
        </button>
        <span>{data.quantity}</span>
        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer">
          <FaPlus
            size={12}
            onClick={() => handleIncrease(data.id, data.quantity)}
          />
        </button>
        <button
          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
          onClick={() => dispatch(removeCartItem(data.id))}
        >
          <FaTrashAlt size={14} />
        </button>
      </div>
    </div>
  );
};

export default CartItemCard;
