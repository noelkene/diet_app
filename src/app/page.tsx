export default function Home() {
    return (
        <div className="space-y-6">
            <section className="text-center py-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Eat Smarter, Reduce Waste</h2>
                <p className="text-gray-600 mb-8">
                    Upload a photo of your fridge, get personalized recipes for your family.
                </p>
                <div className="flex justify-center gap-4">
                    <a href="/inventory" className="btn btn-primary text-lg px-6 py-3">
                        Check Fridge
                    </a>
                    <a href="/recipes" className="btn bg-gray-100 text-gray-700 text-lg px-6 py-3 hover:bg-gray-200">
                        View Meals
                    </a>
                </div>
            </section>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-xl font-semibold mb-2">📸 Smart Inventory</h3>
                    <p className="text-gray-500">
                        Take a picture of your pantry or fridge. Our AI identifies what you have instantly.
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-xl font-semibold mb-2">🥗 Tailored Plans</h3>
                    <p className="text-gray-500">
                        Meals that fit everyone: Low carb for her, high energy for him, and healthy for you.
                    </p>
                </div>
            </div>
        </div>
    );
}
