// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Sidebar from "./Sidebar";

// export default function AddProduct() {
//   const navigate = useNavigate();

//   const [product, setProduct] = useState({
//     name: "",
//     description: "",
//     price: "",
//     stock: "",
//     category: "",
//     images: [],
//     approved: false
//   });

//   const [previews, setPreviews] = useState([]);

//   const [customCategory, setCustomCategory] = useState("");

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setProduct({ ...product, [name]: value });

//     if (name === 'category' && value !== 'Other') {
//       setCustomCategory("");
//     }
//   };

//   // ✅ Pick many images + add more later
//   const handleImages = (e) => {
//     const files = Array.from(e.target.files);

//     Promise.all(
//       files.map(file =>
//         new Promise((resolve) => {
//           const reader = new FileReader();
//           reader.onload = () => resolve(reader.result);
//           reader.readAsDataURL(file);
//         })
//       )
//     ).then((newImages) => {
//       setProduct(prev => ({
//         ...prev,
//         images: [...prev.images, ...newImages]
//       }));

//       setPreviews(prev => [...prev, ...newImages]);
//     });
//   };

//   // ✅ Remove single image
//   const removeImage = (index) => {
//     setProduct(prev => ({
//       ...prev,
//       images: prev.images.filter((_, i) => i !== index)
//     }));

//     setPreviews(prev => prev.filter((_, i) => i !== index));
//   };

//   const submitProduct = () => {
//     if (!product.name || !product.price) {
//       alert("Please fill required fields");
//       return;
//     }

//     if (product.category === 'Other' && !customCategory.trim()) {
//       alert('Please specify a category');
//       return;
//     }

//     const existing = JSON.parse(localStorage.getItem("products")) || [];

//     existing.push({
//       ...product,
//       category: product.category === 'Other' ? customCategory.trim() : product.category,
//       id: Date.now()
//     });

//     localStorage.setItem("products", JSON.stringify(existing));

//     alert("Submitted for approval!");
//     navigate("/vendorallproducts");
//   };

//   return (

//     <div>
//       <h1 className="text-2xl font-bold mb-6">Product Information</h1>

//       <div>

//         {/* NAME */}
//         <label className="text-sm font-semibold">Product Name *</label>
//         <input
//           name="name"
//           placeholder="Enter product name"
//           value={product.name}
//           onChange={handleChange}
//           className="w-full bg-gray-50 border rounded-md px-4 py-3 mt-2 mb-4"
//         />

//         {/* DESCRIPTION */}
//         <label className="text-sm font-semibold">Description *</label>
//         <textarea
//           name="description"
//           placeholder="Enter product description"
//           rows="4"
//           value={product.description}
//           onChange={handleChange}
//           className="w-full bg-gray-50 border rounded-md px-4 py-3 mt-2 mb-4"
//         />

//         {/* PRICE + STOCK */}
//         <div className="grid md:grid-cols-2 gap-4 mb-4">

//           <div>
//             <label className="text-sm font-semibold">Price ($) *</label>
//             <input
//               name="price"
//               placeholder="0.00"
//               value={product.price}
//               onChange={handleChange}
//               className="w-full bg-gray-50 border rounded-md px-4 py-3 mt-2"
//             />
//           </div>

//           <div>
//             <label className="text-sm font-semibold">Stock Quantity *</label>
//             <input
//               name="stock"
//               placeholder="0"
//               value={product.stock}
//               onChange={handleChange}
//               className="w-full bg-gray-50 border rounded-md px-4 py-3 mt-2"
//             />
//           </div>

//         </div>

//         {/* CATEGORY */}
//         <label className="text-sm font-semibold">Category *</label>
//         <select
//           name="category"
//           value={product.category}
//           onChange={handleChange}
//           className="w-full bg-gray-50 border rounded-md px-4 py-3 mt-2 mb-4"
//         >
//           <option value="">Select a category</option>
//           <option>Electronics</option>
//           <option>Fashion</option>
//           <option>Groceries</option>
//           <option>Home</option>
//           <option>Other</option>
//         </select>

//         {product.category === 'Other' && (
//           <div className="mb-4">
//             <label className="text-sm font-semibold">Specify Category *</label>
//             <input
//               name="customCategory"
//               value={customCategory}
//               onChange={(e) => setCustomCategory(e.target.value)}
//               placeholder="Enter category"
//               className="w-full bg-gray-50 border rounded-md px-4 py-3 mt-2"
//             />
//           </div>
//         )}

//         {/* MULTIPLE IMAGE PICKER */}
//         <label className="text-sm font-semibold">Product Images *</label>
//         <input
//           type="file"
//           multiple
//           accept="image/*"
//           onChange={handleImages}
//           className="w-full bg-gray-50 border rounded-md px-4 py-3 mt-2 mb-4"
//         />

//         {/* IMAGE PREVIEW + REMOVE */}
//         <div className="flex gap-3 flex-wrap mb-8">
//           {previews.map((img, i) => (
//             <div key={i} className="relative">
//               <img
//                 src={img}
//                 alt=""
//                 className="w-24 h-24 object-cover rounded"
//               />

//               <button
//                 onClick={() => removeImage(i)}
//                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm"
//               >
//                 ×
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* BUTTONS */}
//         <div className="flex gap-4">

//           <button
//             onClick={submitProduct}
//             className="flex-1 bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-900"
//           >
//             Submit for Approval
//           </button>

//           <button
//             onClick={() => navigate("/products")}
//             className="flex-1 border py-3 rounded-md font-semibold"
//           >
//             Cancel
//           </button>

//         </div>

//       </div>
//     </div>
//   );
// }
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { add_Product } from "../../api/vendor_axios"; // ✅ import backend function

export default function AddProduct() {
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    images: [],
    approved: false,
  });

  const [previews, setPreviews] = useState([]);
  const [customCategory, setCustomCategory] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });

    if (name === "category" && value !== "other") {
      setCustomCategory("");
    }
  };

  // ✅ Pick many images + add more later
  const handleImages = (e) => {
    const files = Array.from(e.target.files);

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((newImages) => {
      setProduct((prev) => ({
        ...prev,
        images: [...prev.images, ...files], // store actual File objects
      }));

      setPreviews((prev) => [...prev, ...newImages]); // previews for UI
    });
  };

  // ✅ Remove single image
  const removeImage = (index) => {
    setProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Submit product to backend
  const submitProduct = async () => {
    if (!product.name || !product.price || !product.description || !product.stock || !product.category) {
      alert("Please fill all required fields");
      return;
    }

    if (product.category === "other" && !customCategory.trim()) {
      alert("Please specify a category");
      return;
    }

    if (product.images.length < 4) {
      alert("Minimum 4 product images are required.");
      return;
    }

    try {
      await add_Product({
        ...product,
        category:
          product.category === "other" ? customCategory.trim() : product.category,
      });

      alert("Product submitted for approval!");
      navigate("/vendorallproducts");
    } catch (error) {
      console.error("Error submitting product:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || "Failed to submit product. Please try again.";
      alert(errorMessage);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#fb923c] via-[#c084fc] to-[#a78bfa] rounded-[32px] p-8 shadow-xl shadow-purple-500/10 mb-10 overflow-hidden relative border border-white/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative">
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">Add New Product</h2>
          <p className="text-white/80 font-bold mt-2 uppercase tracking-[3px] text-xs">
            List your item on the marketplace
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight flex items-center gap-3">
          <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
          Basic Information
        </h3>

        <div className="space-y-6">
          {/* NAME */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 block ml-1">Product Name *</label>
            <input
              name="name"
              placeholder="e.g. Premium Wireless Headphones"
              value={product.name}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-6 py-4 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-gray-900 placeholder-gray-300"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 block ml-1">Description *</label>
            <textarea
              name="description"
              placeholder="Describe the features and benefits..."
              rows="4"
              value={product.description}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-6 py-4 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-gray-900 placeholder-gray-300"
            />
          </div>

          {/* PRICE + STOCK */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 block ml-1">Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  name="price"
                  placeholder="0.00"
                  value={product.price}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-[20px] pl-10 pr-6 py-4 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-gray-900 placeholder-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 block ml-1">Stock Quantity *</label>
              <input
                name="stock"
                placeholder="0"
                value={product.stock}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-6 py-4 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-gray-900 placeholder-gray-300"
              />
            </div>
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 block ml-1">Category *</label>
            <select
              name="category"
              value={product.category}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-6 py-4 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-gray-900 appearance-none cursor-pointer"
            >
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="home_kitchen">Home & Kitchen</option>
              <option value="grocery">Groceries</option>
              <option value="beauty_personal_care">Beauty & Personal Care</option>
              <option value="sports_fitness">Sports & Fitness</option>
              <option value="toys_games">Toys & Games</option>
              <option value="automotive">Automotive</option>
              <option value="books">Books</option>
              <option value="services">Services</option>
              <option value="other">Other</option>
            </select>
          </div>

          {product.category === "other" && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 block ml-1">Specify Category *</label>
              <input
                name="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter category"
                className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-6 py-4 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all font-bold text-gray-900 placeholder-gray-300"
              />
            </div>
          )}

          {/* MULTIPLE IMAGE PICKER */}
          <div className="mt-10">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 block ml-1">Product Images (Min 4 required) *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-100 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-orange-200 transition-all group">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform mb-2">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Add Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImages}
                  className="hidden"
                />
              </label>

              {previews.map((img, i) => (
                <div key={i} className="relative aspect-square animate-in zoom-in duration-300">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-[24px] shadow-sm border border-gray-100" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg hover:scale-110 active:scale-90 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 pt-10">
            <button
              onClick={submitProduct}
              className="flex-[2] bg-gradient-to-r from-orange-400 to-purple-500 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Submit for Approval
            </button>

            <button
              onClick={() => navigate("/vendorallproducts")}
              className="flex-1 bg-gray-50 text-gray-400 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}