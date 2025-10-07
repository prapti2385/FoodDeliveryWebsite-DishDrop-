import React, { useEffect } from "react";
import { serverUrl } from "../src/App";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyShopData } from "../src/redux/ownerSlice";
import { current } from "@reduxjs/toolkit";
import { setItemsInMyCity, setShopsInMyCity } from "../src/redux/userSlice";

const useGetItemsByCity = () => {
  const { currentCity, userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/item/get-by-city/${currentCity}`,
          {
            withCredentials: true,
          }
        );
        dispatch(setItemsInMyCity(result.data));
        console.log(result.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchItems();
  }, [currentCity, userData]);
};

export default useGetItemsByCity;
