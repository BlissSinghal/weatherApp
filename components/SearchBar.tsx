/*
Search Bar 
A search bar component for searching locations.

*/

//importing the required stuff
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";


//Defining the properties that our SearchBar component will accept
/*
Placeholder: the prompt to display when the input is empty 
onSearch: callback function when user submits a search query; 
*/

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}


//The SearchBar component itself
export default function SearchBar({ placeholder = "Search...", onSearch }: SearchBarProps) {
    //var that will store the user's input 
  const [text, setText] = useState("");

  //function such that when the user presses submit -> it calls the onSearch func 
  const handleSubmit = () => {
    if (text.trim().length > 0) {
      onSearch(text.trim());
    }
  };

  return (
    <View style={styles.container}>
      {/* Magnifying glass icon */}
      <Ionicons name="search" size={22} color="#aaa" style={styles.icon} />

      {/* Input field */}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />

      {/* clickable search icon */}
      <TouchableOpacity onPress={handleSubmit}>
        <Ionicons name="arrow-forward-circle" size={26} color="#ffd33d" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
    fontSize: 16,
  },
});