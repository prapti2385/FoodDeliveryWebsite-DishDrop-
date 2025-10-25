import React from "react";
import { useNavigate } from "react-router-dom";

const UserOrderCard = ({ data }) => {
  const navigate = useNavigate();
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex justify-between border-b pb-2">
        <div>
          <p className="font-semibold">Order #{data._id.slice(-6)}</p>
          <p className="text-sm text-gray-500">
            Date: {formatDate(data.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {data.paymentMethod?.toUpperCase()}
          </p>
          <p className="font-medium text-blue-600">
            {data.shopOrders[0].status.toUpperCase()}
          </p>
        </div>
      </div>
      {data.shopOrders.map((shopOrder, index) => (
        <div
          className="border rounded-lg p-3 bg-[#fffaf7] space-y-3"
          key={index}
        >
          <p>{shopOrder.shop.name}</p>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {shopOrder.shopOrderItems.map((item, index) => (
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
          <div className="flex justify-between items-center border-t pt-2">
            <p className="font-semibold">Subtotal: ₹{shopOrder.subTotal}</p>
            <span className="text-sm font-medium text-blue-600">
              Status: {shopOrder.status.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center border-t pt-2">
        <p className="font-semibold">Total: ₹{data.totalAmount}</p>
        <button
          className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm"
          onClick={() => navigate(`/track-order/${data._id}`)}
        >
          Track Order
        </button>
      </div>
    </div>
  );
};

export default UserOrderCard;
