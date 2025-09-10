// "use client";

// import { useEffect, useState } from "react";
// import { usePathname, useRouter } from "next/navigation";
// import Header from "@/app/components/Header";
// import HeaderNoLogin from "@/app/components/HeaderNoLogin";

// const RequireAuth = ({ children }) => {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [isLoading, setIsLoading] = useState(true);
//   const [hasToken, setHasToken] = useState(false);

//   const publicRoutes = [
//     "/user-login",
//     "/forgot-password",
//     "/",
//     "/Categories",
//     "/About",
//     "/Help",
//     "/book-detail/:id",
//     "/News"
//   ];

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     console.log("TOKEN:", token);
//     setHasToken(!!token);

//     if (!token && !publicRoutes.includes(pathname)) {
//       router.push("/user-login");
//     } else {
//       setIsLoading(false);
//     }
//   }, [pathname, router]);

//   if (isLoading) return null;

//   const LayoutWithHeader = () => {
//     // Không cần header trên trang login
//     if (pathname === "/user-login" || pathname === "/forgot-password") {
//       return <>{children}</>;
//     }

//     const isPublicPage = publicRoutes.includes(pathname);

//     return (
//       <>
//         {hasToken || !isPublicPage ? <Header /> : <HeaderNoLogin />}
//         <main
//           style={{
//             padding: "0 180px 0 0px",
//             maxWidth: "100%",
//             boxSizing: "border-box",
//             backgroundImage: 'url("/images/bg.png")',
//             backgroundSize: "cover",
//             backgroundPosition: "center",
//           }}
//         >
//           {children}
//         </main>
//       </>
//     );
//   };

//   return <LayoutWithHeader />;
// };

// export default RequireAuth;

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import HeaderNoLogin from "@/app/components/HeaderNoLogin";

const RequireAuth = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  // Cập nhật route: dùng ký hiệu động giống pattern
  const publicRoutes = [
    "/user-login",
    "/forgot-password",
    "/",
    "/Categories",
    "/About",
    "/Help",
    "/book-detail/:id",
    "/News"
  ];

  // Hàm so khớp route động
  const isPublicPath = (path) => {
    return publicRoutes.some((route) => {
      if (route.includes(":")) {
        // Convert "/book-detail/:id" => regex ^/book-detail/[^/]+$
        const pattern = "^" + route.replace(/:[^/]+/g, "[^/]+") + "$";
        return new RegExp(pattern).test(path);
      }
      return route === path;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setHasToken(!!token);

    if (!token && !isPublicPath(pathname)) {
      router.push("/user-login");
    } else {
      setIsLoading(false);
    }
  }, [pathname, router]);

  if (isLoading) return null;

  const LayoutWithHeader = () => {
    // Không hiển thị header trên trang login hoặc quên mật khẩu
    if (pathname === "/user-login" || pathname === "/forgot-password") {
      return <>{children}</>;
    }

    const isPublicPage = isPublicPath(pathname);

    return (
      <>
        {hasToken || !isPublicPage ? <Header /> : <HeaderNoLogin />}
        <main
          style={{
            padding: "0 180px 0 0px",
            maxWidth: "100%",
            boxSizing: "border-box",
            backgroundImage: 'url("/images/bg.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {children}
        </main>
      </>
    );
  };

  return <LayoutWithHeader />;
};

export default RequireAuth;