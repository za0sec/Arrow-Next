import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CountersSection from './components/CountersSection';
import LoginModal from "./components/LoginModal";
import {useRouter} from "next/router";
import {authenticate, checkToken, fetchWithToken} from "./utils/auth";
import config from "../pages/utils/config";
import Cookies from "js-cookie";
import apiClient from "@/pages/utils/apiClient";

export default function Home({token = true}) {
    const router = useRouter();

    const [visitedClients, setVisitedClients] = useState(0);
    const [counter1, setCounter1] = useState(50);
    const [counter2, setCounter2] = useState(15);
    const [counter3, setCounter3] = useState(10);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchCounters() {
            const response = await apiClient.get('/getCounters');

            const data = response.data;

            setVisitedClients(data.visitedClients);
            setCounter1(data.companies);
            setCounter2(data.users);
            setCounter3(data.years);
        }

        fetchCounters();
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);

    function openModal() {
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
    }

    if (loading) {
        return <p className="text-white">Cargando...</p>;
    }

    return (
        <div className="bg-gray-900 overflow-hidden min-h-screen flex flex-col px-4 sm:px-6 lg:px-24">
            <div className="sticky top-0 z-50">
                <Navbar openModal={openModal} />
            </div>
            <div className="w-full">
                <div className="relative z-10 pb-8 bg-gray-900 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                    <HeroSection openModal={openModal} />
                    <br/><br/>
                    <CountersSection visitedClients={visitedClients} counter1={counter1} counter2={counter2}
                                     counter3={counter3}/>
                </div>
            </div>
            <LoginModal isOpen={isModalOpen} closeModal={closeModal} />

        </div>
    );
}
