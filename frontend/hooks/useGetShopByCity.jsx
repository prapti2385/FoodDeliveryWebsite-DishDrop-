import React, { useEffect } from "react";
import { serverUrl } from "../src/App";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyShopData } from "../src/redux/ownerSlice";
import { current } from "@reduxjs/toolkit";
import { setShopsInMyCity } from "../src/redux/userSlice";

const useGetShopByCity = () => {
  const { currentCity, userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/shop/get-by-city/${currentCity}`,
          {
            withCredentials: true,
          }
        );
        dispatch(setShopsInMyCity(result.data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchShops();
  }, [currentCity, userData]);
};

export default useGetShopByCity;
