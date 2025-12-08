import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

// --- INITIAL STATE FOR NEW CATEGORY ---
const initialNewCategoryState = {
  name: '',
  defaultHsn: '',
  defaultGst: '0',
  active: true,
};

// --- MODERN INPUT COMPONENT (Reusable) ---
const ModernFormInput = ({ label, value, onChangeText, keyboardType = 'default', icon, placeholder }) => (
  <View className="mb-4">
    <Text className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider">
      {label}
    </Text>
    <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 overflow-hidden h-12">
      {icon && (
        <View className="pl-3 pr-2 border-r border-gray-200">
          <Ionicons name={icon} size={20} color="#6B7280" />
        </View>
      )}
      <TextInput
        value={value ? value.toString() : ''}
        onChangeText={onChangeText}
        className="flex-1 px-3 text-gray-800 text-base"
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
      />
    </View>
  </View>
);

const Categories = () => {
  const { width } = useWindowDimensions();
  const isWeb = width > 900;
  // CHANGED: numColumns to 3 for web to match Homepage
  const numColumns = isWeb ? 3 : 1; 

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // CHANGED: Added Search Query State
  const [searchQuery, setSearchQuery] = useState('');
  
  // CHANGED: Added Hover State for Tooltip
  const [hoveredButton, setHoveredButton] = useState(null);

  // --- ADD CATEGORY STATES ---
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState(initialNewCategoryState);

  // --- EDIT MODAL STATES ---
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    defaultHsn: '',
    defaultGst: '',
    active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      let response = await rootApi.get(`api/billing/category/all`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  // CHANGED: Filter Logic based on Search Query
  const filteredCategories = categories.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.id && item.id.toString().includes(query)) ||
      (item.defaultHsn && item.defaultHsn.includes(query))
    );
  });

  // ---------------------------------------------
  //           ADD CATEGORY LOGIC
  // ---------------------------------------------
  const handleAddCategory = async () => {
    try {
      if (!newCategoryData.name) {
        Alert.alert("Error", "Category name is required.");
        return;
      }

      const dto = {
        name: newCategoryData.name,
        defaultHsn: newCategoryData.defaultHsn,
        defaultGst: parseFloat(newCategoryData.defaultGst) || 0,
        active: newCategoryData.active,
      };

      // Using rootApi instead of hardcoded URL
      await rootApi.post(`api/billing/category/create`, dto);
      
      Alert.alert("Success", "Category added successfully!");
      
      // Reset and Close
      setNewCategoryData(initialNewCategoryState);
      setAddCategoryModalVisible(false);
      
      // Refresh List
      fetchCategories();

    } catch (error) {
      console.log("Add Category Error:", error);
      Alert.alert("Error", "Failed to add category.");
    }
  };

  // ---------------------------------------------
  //           EDIT CATEGORY LOGIC
  // ---------------------------------------------
  const openEditModal = (item) => {
    setEditData({
      id: item.id,
      name: item.name,
      defaultHsn: item.defaultHsn || '',
      defaultGst: item.defaultGst ? item.defaultGst.toString() : '0',
      active: item.active,
    });
    setEditModalVisible(true);
  };

  const handleUpdateCategory = async () => {
    if (!editData.name) {
      Alert.alert("Error", "Category Name is required");
      return;
    }

    try {
      const dto = {
        name: editData.name,
        defaultHsn: editData.defaultHsn,
        defaultGst: parseFloat(editData.defaultGst) || 0,
        active: editData.active,
      };

      await rootApi.put(`api/billing/category/${editData.id}`, dto);

      // Optimistic Update
      setCategories((prev) =>
        prev.map((cat) => (cat.id === editData.id ? { ...cat, ...dto, id: editData.id } : cat))
      );

      setEditModalVisible(false);
      Alert.alert("Success", "Category updated successfully!");

    } catch (error) {
      console.log("Update Error:", error);
      Alert.alert("Error", "Failed to update category.");
    }
  };

  const renderCategoryItem = ({ item }) => (
    <View 
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 overflow-hidden"
      // CHANGED: Style to match Homepage 3-column layout
      style={{
        flex: 1,
        margin: 8,
        maxWidth: isWeb ? `${(100 / numColumns) - 2}%` : '100%',
        minWidth: isWeb ? '30%' : '100%',
      }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1">
          <View className="bg-purple-50 p-3 rounded-full mr-3 border border-purple-100">
             <MaterialIcons name="category" size={20} color="#7C3AED" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
            <Text className="text-xs text-gray-400 font-mono">ID: {item.id}</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => openEditModal(item)}
          className="p-2 bg-blue-50 rounded-full border border-blue-100 ml-2"
        >
          <MaterialIcons name="edit" size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View className="h-[1px] bg-gray-100 mb-3" />

      <View className="flex-row justify-between items-center bg-gray-50 p-3 rounded-xl">
        <View>
          <Text className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">HSN Code</Text>
          <Text className="text-sm font-semibold text-gray-700 font-mono">
            {item.defaultHsn || 'N/A'}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">GST Rate</Text>
          <Text className="text-lg font-bold text-blue-600">
            {item.defaultGst ? item.defaultGst.toFixed(2) : '0.00'}%
          </Text>
        </View>
      </View>

      <View className={`mt-2 py-1 px-3 rounded-lg self-start ${item.active ? 'bg-green-100' : 'bg-red-100'}`}>
         <Text className={`text-[10px] font-bold uppercase ${item.active ? 'text-green-700' : 'text-red-700'}`}>
           {item.active ? 'Active' : 'Inactive'}
         </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* --- HEADER --- */}
      <View className="bg-blue-900 pt-10 pb-4 px-4 rounded-b-3xl shadow-lg z-10">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-white text-xl font-bold tracking-wide">Categories</Text>
            <Text className="text-blue-200 text-xs mt-1">
              Total Categories: {categories.length}
            </Text>
          </View>
          
          {/* --- ADD BUTTON IN HEADER WITH TOOLTIP --- */}
          <View className="relative z-50">
            <TouchableOpacity 
              onPress={() => setAddCategoryModalVisible(true)}
              onMouseEnter={() => setHoveredButton('add')}
              onMouseLeave={() => setHoveredButton(null)}
              className="bg-white p-3 rounded-full shadow-lg flex-row items-center"
            >
              <Ionicons name="add" size={24} color="#1E3A8A" />
            </TouchableOpacity>
            
            {/* CHANGED: Tooltip Position fixed (Left side) to avoid overlapping search bar */}
            {hoveredButton === 'add' && (
              <View className="absolute top-2 right-14 bg-gray-800 px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                <Text className="text-white text-xs font-bold">Add Category</Text>
              </View>
            )}
          </View>
        </View>

        {/* CHANGED: Search Bar Added */}
        <View className="flex-row items-center bg-white rounded-full px-3 h-10 shadow-sm">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search Categories..."
            className="flex-1 ml-2 text-base text-gray-800 h-full"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* --- LIST CONTENT --- */}
      <View className="flex-1 px-2">
        {loading ? (
          <ActivityIndicator size="large" color="#1E3A8A" className="mt-10" />
        ) : (
          <FlatList
            key={numColumns} // CHANGED: Key changes with columns to force re-render
            data={filteredCategories} // CHANGED: Using filtered list
            keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
            renderItem={renderCategoryItem}
            numColumns={numColumns}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: isWeb ? 10 : 0 }}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={isWeb ? { justifyContent: 'flex-start' } : undefined}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E3A8A"]} />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-20 opacity-60">
                 <View className="bg-gray-200 p-6 rounded-full mb-4">
                    <MaterialIcons name="category" size={48} color="#9CA3AF" />
                 </View>
                 <Text className="text-gray-500 font-bold text-lg">No categories found</Text>
                 <Text className="text-gray-400 text-sm mt-2">Tap the + button to create one.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* --------------------- ADD CATEGORY MODAL --------------------- */}
      <Modal visible={addCategoryModalVisible} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <View className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-gray-100">
            
            {/* Modal Header */}
            <View className="items-center mb-6">
              <View className="bg-purple-100 w-16 h-16 rounded-full items-center justify-center mb-3">
                <MaterialIcons name="add-circle" size={32} color="purple" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">New Category</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ModernFormInput
                label="Category Name"
                placeholder="Ex: Dairy, Electronics"
                value={newCategoryData.name}
                onChangeText={(t) => setNewCategoryData(prev => ({ ...prev, name: t }))}
                icon="text"
              />

              <View className="flex-row gap-3">
                <ModernFormInput
                  label="Default HSN"
                  placeholder="Optional"
                  value={newCategoryData.defaultHsn}
                  onChangeText={(t) => setNewCategoryData(prev => ({ ...prev, defaultHsn: t }))}
                  icon="document-text-outline"
                />
                <ModernFormInput
                  label="Default GST %"
                  placeholder="0"
                  value={newCategoryData.defaultGst}
                  onChangeText={(t) => setNewCategoryData(prev => ({ ...prev, defaultGst: t }))}
                  keyboardType="numeric"
                  icon="pie-chart-outline"
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Status</Text>
                <TouchableOpacity
                  onPress={() => setNewCategoryData(prev => ({ ...prev, active: !prev.active }))}
                  className={`flex-row items-center justify-between p-4 rounded-xl border ${newCategoryData.active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                >
                  <Text className={`font-bold ${newCategoryData.active ? 'text-green-700' : 'text-red-700'}`}>
                    {newCategoryData.active ? 'Active Category' : 'Inactive Category'}
                  </Text>
                  <Ionicons name={newCategoryData.active ? "checkmark-circle" : "ban"} size={24} color={newCategoryData.active ? "green" : "red"} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity onPress={() => { setAddCategoryModalVisible(false); setNewCategoryData(initialNewCategoryState); }} className="flex-1 bg-gray-100 py-4 rounded-xl">
                <Text className="text-gray-600 text-center font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddCategory} className="flex-1 bg-purple-600 py-4 rounded-xl shadow-md">
                <Text className="text-white text-center font-bold text-lg">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --------------------- EDIT CATEGORY MODAL --------------------- */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center p-4 backdrop-blur-sm">
          <View className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100">
            
            <View className="flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <Text className="text-2xl font-bold text-gray-800">Edit Category</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ModernFormInput
                label="Category Name"
                value={editData.name}
                onChangeText={(t) => setEditData({...editData, name: t})}
                icon="text"
                placeholder="Enter Name"
              />
              <ModernFormInput
                label="Default HSN"
                value={editData.defaultHsn}
                onChangeText={(t) => setEditData({...editData, defaultHsn: t})}
                icon="document-text-outline"
                placeholder="HSN Code"
              />
              <ModernFormInput
                label="Default GST %"
                value={editData.defaultGst}
                onChangeText={(t) => setEditData({...editData, defaultGst: t})}
                keyboardType="numeric"
                icon="pie-chart-outline"
                placeholder="0.0"
              />

              <View className="mb-4 mt-2">
                <Text className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Status</Text>
                <TouchableOpacity
                  onPress={() => setEditData({ ...editData, active: !editData.active })}
                  className={`flex-row items-center justify-between p-4 rounded-xl border ${editData.active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                >
                  <Text className={`font-bold ${editData.active ? 'text-green-700' : 'text-red-700'}`}>
                    {editData.active ? 'Active Category' : 'Inactive Category'}
                  </Text>
                  <Ionicons name={editData.active ? "checkmark-circle" : "ban"} size={24} color={editData.active ? "#16A34A" : "#DC2626"} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View className="mt-6 flex-row gap-4">
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="flex-1 bg-gray-100 py-4 rounded-xl border border-gray-200">
                <Text className="text-gray-600 text-center font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateCategory} className="flex-1 bg-blue-600 py-4 rounded-xl shadow-lg">
                <Text className="text-white text-center font-bold text-lg">Save</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
};

export default Categories;