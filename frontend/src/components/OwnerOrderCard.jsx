import axios from "axios";
import React from "react";
import { FaPhoneAlt } from "react-icons/fa";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../redux/userSlice";
import { useState } from "react";

const OwnerOrderCard = ({ data }) => {
  const [availableBoys, setAvailableBoys] = useState([]);
  const dispatch = useDispatch();
  const handleUpdateStatus = async (orderId, shopId, status) => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true }
      );
      dispatch(updateOrderStatus({ orderId, shopId, status }));
      setAvailableBoys(result.data.availableBoys);
      console.log(result.data);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          {data.user.fullName}
        </h2>
        <p className="text-sm text-gray-500">{data.user.email}</p>
        <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <span>
            <FaPhoneAlt />
          </span>
          {data.user.mobile}
        </p>
      </div>
      <div className="flex items-start flex-col gap-2 text-gray-600 text-sm">
        <p>{data?.deliveryAddress.text}</p>
        <p className="text-xs text-gray-500">
          Lat: {data?.deliveryAddress.latitude}, Lng:{" "}
          {data?.deliveryAddress.longitude}{" "}
        </p>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {data.shopOrders?.shopOrderItems?.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
          >
            <img src={item.item.image} alt="no image" />
            <p className="text-sm font-semibold mt-1">{item.item.name}</p>
            <p className="text-xs text-gray-500">
              Qty: {item.quantity} x ₹{item.price}
            </p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
        <span className="text-sm">
          Status:{" "}
          <span className="font-semibold capitalize text-[#ff4d2d]">
            {data.shopOrders?.status?.toUpperCase()}
          </span>
        </span>
        <select
          className="rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d]"
          onChange={(e) =>
            handleUpdateStatus(
              data._id,
              data.shopOrders?.shop?._id ?? data.shopOrders.shop,
              e.target.value
            )
          }
        >
          <option value="">Change</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="out for delivery">Out For Delivery</option>
        </select>
      </div>
      {data.shopOrders.status === "out for delivery" && (
        <div className="mt-3 p-2 border rounded-lg text-sm bg-orange-50">
          <p>Available Delivery Boys: </p>
          {availableBoys.length > 0 ? (
            availableBoys.map((b, index) => (
              <div className="text-gray-800">
                {b.fullName} - {b.mobile}
              </div>
            ))
          ) : (
            <div>Waiting for Delivery Boy to accept</div>
          )}
        </div>
      )}
      <div className="text-right font-bold text-gray-800 text-sm">
        Total: ₹{data.shopOrders.subTotal}
      </div>
    </div>
  );
};

export default OwnerOrderCard;
