import { DeleteRequest } from "@/types";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function DeleteRequestBadge({ req }: { req: DeleteRequest }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[req.status]}`}>
      Delete {req.status}
    </span>
  );
}
