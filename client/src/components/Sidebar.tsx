import { clearChatHistory, deleteSession } from "../api";


export default function Sidebar() {
    const handleDeleteSession = async () => {
        await deleteSession('sdf');
        alert("Session deleted");
    };

    const handleDeleteHistory = async () => {
        await clearChatHistory("sdf");
        alert("History deleted");
    };

    return (
        <div className="w-64 bg-gray-800 text-white p-4 space-y-4">
            <h2 className="text-xl font-bold">Actions</h2>
            <button onClick={handleDeleteSession} className="w-full py-2 bg-red-600 rounded">
                Delete Session
            </button>
            <button onClick={handleDeleteHistory} className="w-full py-2 bg-yellow-600 rounded">
                Delete History
            </button>
        </div>
    );
}
