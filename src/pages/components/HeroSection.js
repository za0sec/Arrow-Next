
export default function HeroSection({ openModal }) {
    return (
        <main
            className="mt-10 mx-auto sm:mt-12 md:mt-16 lg:mt-20 xl:mt-28 lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2 text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                    <span className="block xl:inline">Elevando los Estándares de Supervisión con <br/></span>{' '}
                    <span className="block text-primary xl:inline">Arrow Connect</span>
                </h1>
                <br/>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg md:mt-5 md:text-xl lg:max-w-full lg:mx-0">
                    Arrow Connect garantiza una supervisión eficiente, registrando cada tarea y visita con la precisión adecuada para tu empresa.
                </p>
                <br/><br/>
                <div className="mt-5 sm:mt-8 flex justify-start space-x-4">
                    <button
                        onClick={openModal}
                        className="bg-primary text-white font-medium px-6 py-2 rounded-md hover:bg-secondary"
                    >
                        Iniciar Sesión
                    </button>
                    <div className="rounded-md shadow">
                        <a
                            href="#"
                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-gray-800 hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
                        >
                            Registrarse
                        </a>
                    </div>
                </div>
            </div>
            <div className="mt-10 lg:mt-0 lg:w-1/2 flex justify-center lg:justify-end">
                <img src="/svg/arrow_connect.svg" alt="Imagen moderna"
                     className="w-full h-auto max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl"/>
            </div>
        </main>
    );
}
