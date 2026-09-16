import Image from "next/image";
import { useLocale } from "next-intl";
import PageHeader from "@/components/PageHeader";
import { SERVANTS_DIR, servants, servantsTitleAr } from "@/config";

export default function ServantsPage() {
  const isAr = useLocale() === "ar";

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={isAr ? servantsTitleAr : "Servants"} icon="🙏" />

      {servants.length === 0 ? (
        <div className="mx-4 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-6 text-center backdrop-blur-sm">
          <p className="mb-2 text-3xl">🙏</p>
          <p className="font-semibold text-white">
            {isAr ? "قريب هنضيف خدام الاجتماع" : "Servants coming soon"}
          </p>
          <p className="mt-1 text-sm text-blue-light/60">
            {isAr
              ? "هتلاقوا هنا خدام الاجتماع وأدوارهم."
              : "This meeting's servants will appear here soon."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-4">
          {servants.map(({ file, nameAr }) => (
            <div key={file}
              className="flex flex-col items-center gap-3 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4 backdrop-blur-sm">
              <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-blue-accent/40 shadow-lg shadow-blue-accent/20">
                <Image
                  src={`${SERVANTS_DIR}/${file}`}
                  alt={nameAr}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <p className="text-sm font-semibold text-white text-center">{nameAr}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
