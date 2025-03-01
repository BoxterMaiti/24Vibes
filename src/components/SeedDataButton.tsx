import React, { useState } from 'react';
import { reseedColleagues, loadColleaguesFromJson } from '../services/colleagueService';

const SeedDataButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeedData = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      // First try to load directly from JSON to check if the file exists
      const jsonColleagues = await loadColleaguesFromJson();
      
      if (jsonColleagues.length === 0) {
        setResult({
          success: false,
          message: "Could not load colleagues from JSON file. Please check that the file exists at /public/Colleagues.json."
        });
        return;
      }
      
      // Now try to seed to Firestore
      const colleagues = await reseedColleagues();
      
      setResult({
        success: true,
        message: `Successfully loaded ${colleagues.length} colleagues${colleagues.length > 0 ? " and saved to database" : ""}.`
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      setResult({
        success: false,
        message: `Failed to seed data: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleSeedData}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            <span>Reloading Data...</span>
          </>
        ) : (
          'Reload Colleagues Data'
        )}
      </button>
      
      {result && (
        <div className={`mt-2 p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
};

export default SeedDataButton;