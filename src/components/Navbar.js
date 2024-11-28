import { Popover, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Fragment } from 'react';

const navigation = [
    { name: 'Features', href: '#' },
    { name: 'Pricing', href: '#' },
    { name: 'About', href: '#' },
    { name: 'Contact', href: '#' },
];

export default function Navbar({ openModal }) {
    return (
        <Popover>
            <div className="relative pt-6 px-4 sm:px-6 lg:px-8">
                <nav className="relative flex items-center justify-between sm:h-10 lg:justify-start" aria-label="Global">
                    <div className="flex items-center justify-start space-x-4 lg:flex-grow">
                        <img className="h-8 w-auto" src="/images/logo-arrow.png" alt="Icono" />
                        <a href="#">
                            <span className="sr-only">Workflow</span>
                            <img className="h-8 w-auto sm:h-10" src="" alt="" />
                        </a>
                        <div className="hidden md:flex md:space-x-8">
                            {navigation.map((item) => (
                                <Link key={item.name} href={item.href}>
                                    <span className="font-medium text-gray-300 hover:text-white">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex md:items-center md:space-x-4 ml-auto">
                            <button onClick={openModal} className="bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-secondary">
                                Iniciar Sesión
                            </button>
                            <button className="bg-gray-800 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-700">
                                Registrarse
                            </button>
                    </div>

                    <div className="-mr-2 flex items-center md:hidden">
                        <Popover.Button className="bg-gray-900 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </Popover.Button>
                    </div>
                </nav>
            </div>

            <Transition
                as={Fragment}
                enter="duration-150 ease-out"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="duration-100 ease-in"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <Popover.Panel focus className="fixed inset-0 z-50 p-2 transition transform origin-top-right md:hidden">
                    <div className="rounded-lg shadow-md bg-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden">
                        <div className="px-5 pt-4 flex items-center justify-between">
                            <div>
                                <img className="h-8 w-auto" src="/images/logo-arrow.png" alt="" />
                            </div>
                            <div className="-mr-2">
                                <Popover.Button className="bg-gray-900 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                    <span className="sr-only">Close main menu</span>
                                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                </Popover.Button>
                            </div>
                        </div>
                        <div className="mt-3 px-2 space-y-1">
                            {navigation.map((item) => (
                                <Link key={item.name} href={item.href}>
              <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                {item.name}
              </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </Popover.Panel>
            </Transition>
        </Popover>

    );
}
