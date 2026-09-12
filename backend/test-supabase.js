const supabase = require("./supabase");

async function testConnection() {
    const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .limit(1);

    if (error) {
        console.error("❌ Supabase connection failed:");
        console.error(error);
        return;
    }

    console.log("✅ Supabase connected successfully!");
    console.log(data);
}

testConnection();