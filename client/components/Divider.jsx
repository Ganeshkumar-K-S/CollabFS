import React from "react";

export default function Divider() {
    return (
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">OR</span>
            </div>
        </div>
    );
}
