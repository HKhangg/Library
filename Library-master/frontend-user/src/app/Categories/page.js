// "use client";

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import ChatBotButton from "../components/ChatBoxButton";
// import BookCard from "../components/BookCard";
// import LeftSideBar from "../components/LeftSideBar";

// const api = axios.create({
//   baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
//   timeout: 5000,
// });

// export default function CategoriesPage() {
//   const [categories, setCategories] = useState([]);
//   const [children, setChildren] = useState([]);
//   const [books, setBooks] = useState([]);
//   const [activeCategoryId, setActiveCategoryId] = useState(null);
//   const [activeCategoryChildId, setActiveCategoryChildId] = useState(null);
//   const [loadingBooks, setLoadingBooks] = useState(false);

//   useEffect(() => {
//     api
//       .get("/category")
//       .then((res) => {
//         const cats = res.data;
//         setCategories(cats);
//         if (cats.length > 0) {
//           setActiveCategoryId(cats[0].id);
//         }
//       })
//       .catch((err) => console.error("Lỗi fetch categories:", err));
//   }, []);

//   useEffect(() => {
//     if (!activeCategoryId) return;

//     api
//       .get(`/category-child/category/${activeCategoryId}`)
//       .then((res) => {
//         const childs = res.data;
//         setChildren(childs);
//         if (childs.length > 0) {
//           setActiveCategoryChildId(childs[0].id);
//         }
//       })
//       .catch((err) => console.error("Lỗi fetch category-child:", err));
//   }, [activeCategoryId]);

//   useEffect(() => {
//     if (!activeCategoryChildId) return;

//     setLoadingBooks(true);
//     api
//       .get(`/book/category/${activeCategoryChildId}`)
//       .then((res) => {
//         const filteredBooks = res.data.filter((b) => b.trangThai !== "DA_XOA");
//         setBooks(filteredBooks);
//       })
//       .catch((err) => console.error("Lỗi fetch books:", err))
//       .finally(() => setLoadingBooks(false));
//   }, [activeCategoryChildId]);

//   return (
//     <div className="flex flex-col min-h-screen text-foreground">
//       <main className="pt-16 flex">
//         <LeftSideBar />

//         <section className="flex-1 pr-5 md:pl-64 ml-5 my-auto mt-2">
//           {/* Chọn category cha */}
//           <div className="flex gap-4 mb-4">
//             {categories.map((cat) => (
//               <button
//                 key={cat.id}
//                 onClick={() => setActiveCategoryId(cat.id)}
//                 className={`px-4 py-2 rounded-lg ${
//                   activeCategoryId === cat.id
//                     ? "bg-sky-900 text-white"
//                     : "bg-gray-200 text-gray-700"
//                 }`}
//               >
//                 {cat.name}
//               </button>
//             ))}
//           </div>

//           {/* Chọn category con */}
//           {children.length > 0 && (
//             <div className="flex gap-4 mb-6">
//               {children.map((child) => (
//                 <button
//                   key={child.id}
//                   onClick={() => setActiveCategoryChildId(child.id)}
//                   className={`px-4 py-2 rounded-lg ${
//                     activeCategoryChildId === child.id
//                       ? "bg-sky-700 text-white"
//                       : "bg-gray-100 text-gray-700"
//                   }`}
//                 >
//                   {child.name}
//                 </button>
//               ))}
//             </div>
//           )}

//           {/* Danh sách sách */}
//           <div className="bg-white rounded-xl p-5">
//             <h2 className="text-xl font-semibold mb-4">
//               {children.find((c) => c.id === activeCategoryChildId)?.name ||
//                 "Sách"}
//             </h2>

//             {loadingBooks ? (
//               <p>Đang tải sách...</p>
//             ) : (
//               <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
//                 {books.map((book) => (
//                   <BookCard
//                     key={book.maSach}
//                     id={book.maSach}
//                     imageSrc={book.hinhAnh?.[0] || "/placeholder.png"}
//                     status={book.trangThai}
//                     available={
//                       book.trangThai === "CON_SAN" ||
//                       book.trangThai === "DA_HET"
//                     }
//                     title={book.tenSach}
//                     author={book.tenTacGia}
//                     publisher={`${book.nxb} (${book.nam})`}
//                     borrowCount={book.soLuongMuon}
//                   />
//                 ))}
//                 {books.length === 0 && (
//                   <p className="col-span-full text-center text-gray-500">
//                     Không có sách nào.
//                   </p>
//                 )}
//               </div>
//             )}
//           </div>
//         </section>

//         <ChatBotButton />
//       </main>
//     </div>
//   );
// }
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

import BookCard from "../components/BookCard";

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/book`

});

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  const [childrenMap, setChildrenMap] = useState({}); // { parentId: [childList] }
  const [activeParentId, setActiveParentId] = useState(null);
  const [activeChildId, setActiveChildId] = useState(null);

  const [activeFilter, setActiveFilter] = useState("ALL"); 
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/category`)
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => {
        console.error("Lỗi fetch categories:", err);
      });
  }, []);


  useEffect(() => {
    if (activeParentId === null) {
      setActiveChildId(null);
      setActiveFilter("ALL");
      return;
    }
    setActiveFilter("ALL");
    setActiveChildId(null);

    axios
      .get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/category-child/category/${activeParentId}`
      )
      .then((res) => {
        setChildrenMap((prev) => ({
          ...prev,
          [activeParentId]: res.data,
        }));
      })
      .catch((err) => {
        console.error("Lỗi fetch category-child:", err);
      });
  }, [activeParentId]);

  
  useEffect(() => {
    setLoadingBooks(true);

    // Khi đã chọn một category con
    if (activeChildId) {
      api
        .get(`/v2/category-child/${activeChildId}?filter=${activeFilter}`)
        .then((res) => setBooks(res.data))
        .catch((err) => {
          console.error("Lỗi fetch books by child:", err);
          setBooks([]);
        })
        .finally(() => setLoadingBooks(false));
      return;
    }

    // Khi chỉ chọn category cha
    if (activeParentId) {
      api
        .get(`/v2/category-parent/${activeParentId}?filter=${activeFilter}`)
        .then((res) => setBooks(res.data))
        .catch((err) => {
          console.error("Lỗi fetch books by parent:", err);
          setBooks([]);
        })
        .finally(() => setLoadingBooks(false));
      return;
    }

 
    api
      .get(`/v2?filter=${activeFilter}`)
      .then((res) => setBooks(res.data))
      .catch((err) => {
        console.error("Lỗi fetch all books:", err);
        setBooks([]);
      })
      .finally(() => setLoadingBooks(false));
  }, [activeParentId, activeChildId, activeFilter]);

  const filterLabels = {
    ALL: "Tất cả",
    NEWEST: "Mới nhất",
    MOST_BORROWED: "Được mượn nhiều",
  };

  const currentChildList = activeParentId
    ? childrenMap[activeParentId] || []
    : [];

  return (
    <div className="flex min-h-screen pt-16 bg-[url('/pg.jpg')] bg-cover bg-center">
      {/* Sidebar trái */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="px-5 py-4">
          <h2 className="text-lg font-semibold mb-3">Danh Mục</h2>
          <ul>
            {/* Nút “Tất cả” */}
            <li className="mb-1">
              <button
                onClick={() => {
                  setActiveParentId(null);
                  setActiveChildId(null);
                  setActiveFilter("ALL");
                }}
                className={`w-full text-left px-3 py-2 rounded-lg ${
                  activeParentId === null && activeChildId === null
                    ? "bg-sky-900 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                Tất cả
              </button>
            </li>

            {categories.map((cat) => (
              <li key={cat.id} className="mb-2">
                <button
                  onClick={() => {
                    setActiveParentId(cat.id);
                  }}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg ${
                    activeParentId === cat.id
                      ? "bg-sky-900 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-sm text-gray-400">
                    ({cat.soLuongDanhMuc ?? 0})
                  </span>
                </button>

                {activeParentId === cat.id && currentChildList.length > 0 && (
                  <ul className="ml-4 mt-1">
                    {currentChildList.map((child) => (
                      <li key={child.id} className="mb-1">
                        <button
                          onClick={() => {
                            setActiveChildId(child.id);
                            setActiveFilter("ALL");
                          }}
                          className={`w-full text-left px-2 py-1 rounded-lg text-sm ${
                            activeChildId === child.id
                              ? "bg-sky-700 text-white"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {child.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Khu vực chính (bên phải) */}
      <section className="flex-1 p-5">
        {/* Tabs Filter */}
        <div className="flex gap-4 mb-6">
          {Object.entries(filterLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeFilter === key
                  ? "bg-sky-900 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tiêu đề con */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">
            {activeChildId
              ? currentChildList.find((c) => c.id === activeChildId)?.name
              : activeParentId
              ? `Tất cả sách của ${categories.find((c) => c.id === activeParentId)?.name}`
              : "Tất cả sách"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
          {loadingBooks ? (
            <p className="text-gray-500">Đang tải sách...</p>
          ) : books.length > 0 ? (
            books.map((book) => (
              <div
                key={book.id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <BookCard
                  key={book.maSach}
                  id={book.maSach}
                  imageSrc={book.hinhAnh?.[0] || "/placeholder.png"}
                  status={book.trangThai}
                  available={book.trangThai === "CON_SAN"}
                  title={book.tenSach}
                  author={book.tenTacGia}
                  publisher={`${book.nxb} (${book.nam})`}
                  borrowCount={book.soLuongMuon}
                  className="w-full"
                />
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-2">
              Không có sách nào.
            </p>
          )}
        </div>
      </section>

    </div>
  );
}
