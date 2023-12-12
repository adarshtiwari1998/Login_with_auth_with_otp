import axios from "axios";
import { useEffect, useState } from "react";
import { getUsername } from '../helper/helper'

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

export default function useFetch(query) {
  const [getData, setData] = useState({
    isLoading: false,
    apiData: undefined,
    status: null,
    serverError: null,
  });

  useEffect(() => {

    const fetchData = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true }));

        const { username } = !query ? await getUsername() : '';
                
        const { data, status } = !query ? await axios.get(`/api/user/${username}`) : await axios.get(`/api/${query}`);
        // console.log("Response:", data); // Log the data received from the API
        // console.log("Status:", status); // Log the status code

        if (status === 200) {
          setData((prev) => ({
            ...prev,
            isLoading: false,
            apiData: data,
            status: status,
          }));
        } else {
          setData((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error fetching data:", error); // Log any errors
        setData((prev) => ({
          ...prev,
          isLoading: false,
          serverError: error,
        }));
      }
    };
    fetchData();
  }, [query]);

  return [getData, setData];
}