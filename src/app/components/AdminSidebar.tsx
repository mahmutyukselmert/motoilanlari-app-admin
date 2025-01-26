"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";

export default function AdminSidebar({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) {
    const pathname = usePathname();

    const menuItems = [
        { name: "Gösterge Paneli", path: "/admin/dashboard" },
        { name: "İlanlar", path: "/admin/ads" },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 w-64 bg-gray-900 text-white h-auto p-5 z-50 transform ${
                isOpen ? "h-full translate-x-0 w-full" : "-translate-x-full"
            } transition-transform duration-300 lg:relative lg:translate-x-0`}
        >
            {/* Kapatma Butonu (Mobil için) */}
            <button className="lg:hidden text-white absolute top-4 right-4" onClick={toggleSidebar}>
                <FontAwesomeIcon icon={faTimes}/>
            </button>

            <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
            <nav>
                <ul className="space-y-3">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                href={item.path}
                                onClick={window.innerWidth < 1024 ? toggleSidebar : undefined}
                                className={`block px-4 py-2 rounded ${
                                    pathname === item.path ? "bg-blue-500" : "hover:bg-gray-700"
                                }`}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}
